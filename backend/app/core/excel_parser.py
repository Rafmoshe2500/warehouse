import io
import pandas as pd
from typing import List, Dict, Any
from datetime import datetime
from app.core.exceptions import ExcelFileException

class ExcelParser:
    """
    Responsibility: Handle low-level Excel file reading, parsing, column mapping, and data cleaning.
    Domain Agostic: Does not know about Databases or Services.
    """
    
    INVENTORY_COLUMNS_MAP = {
        'מק"ט': 'catalog_number',
        'מק״ט': 'catalog_number',
        'תאור פריט': 'description',
        'תיאור פריט': 'description',
        'מספר יצרן | שם יצרן': 'manufacturer',
        'יצרן': 'manufacturer',
        'מיקום': 'location',
        'סריאלי': 'serial',
        'מלאי קיים': 'current_stock',
        'מלאי': 'current_stock',
        'תוקף אחריות': 'warranty_expiry',
        'יעוד': 'purpose',
        'הערות': 'notes'
    }

    PROJECT_COLUMNS_MAP = {
        'מק"ט': 'catalog_number',
        'מק״ט': 'catalog_number',
        'מיקום': 'location',
        'פרוייקט': 'project',
        'פרויקט': 'project',
        'כמות': 'quantity'
    }

    @staticmethod
    def _read_excel_robust(contents: bytes, required_columns: List[str]) -> pd.DataFrame:
        """Tries to read Excel from header 0, if validation fails triggers logic for header 3"""
        try:
            df = pd.read_excel(io.BytesIO(contents), header=0)
            if not any(col in df.columns for col in required_columns):
                df = pd.read_excel(io.BytesIO(contents), header=3)
        except Exception:
            try:
                df = pd.read_excel(io.BytesIO(contents), header=3)
            except Exception as e:
                raise ExcelFileException(f"שגיאה בקריאת הקובץ: {str(e)}")
        return df

    @staticmethod
    def _clean_record(record: Dict[str, Any]) -> Dict[str, Any]:
        """Cleans a single dictionary record: strips strings, formats dates, handles NaNs"""
        clean_record = {}
        for key, value in record.items():
            if pd.isna(value):
                clean_record[key] = ''
            else:
                if isinstance(value, datetime):
                    clean_record[key] = value.strftime('%Y-%m-%d')
                else:
                    clean_record[key] = str(value).strip()
        return clean_record

    @classmethod
    def parse_inventory(cls, contents: bytes) -> List[Dict[str, Any]]:
        """Parses inventory Excel file into a list of clean dictionaries"""
        # Check required for robust read strategy (at least one of these should show up)
        check_cols = ['מק"ט', 'תאור פריט', 'סריאלי', 'מק״ט']
        
        df = cls._read_excel_robust(contents, check_cols)
        
        # Remove summary line if exists
        if len(df) > 0:
            df = df.iloc[:-1]

        # Rename columns
        df = df.rename(columns=cls.INVENTORY_COLUMNS_MAP)

        # Strict Validation: Ensure critical columns exist
        required_columns = ['catalog_number', 'description', 'manufacturer', 'serial']
        missing = [col for col in required_columns if col not in df.columns]
        if missing:
             # Translate back to Hebrew for better error message if possible
             rev_map = {v: k for k, v in cls.INVENTORY_COLUMNS_MAP.items()} 
             missing_heb = [rev_map.get(m, m) for m in missing]
             raise ExcelFileException(f"קובץ המלאי אינו תקין. חסרות העמודות הבאות: {', '.join(missing_heb)}")
        
        # Convert to records
        records = df.to_dict('records')
        
        cleaned_records = []
        for record in records:
            # Skip empty rows
            if not any(str(v).strip() for v in record.values()):
                continue
                
            clean = cls._clean_record(record)
            
            # Defaults
            clean.setdefault('purpose', '')
            clean.setdefault('notes', '')
            
            cleaned_records.append(clean)
            
        return cleaned_records

    @classmethod
    def parse_project_allocation(cls, contents: bytes) -> List[Dict[str, Any]]:
        """Parses project allocation file with strict validation"""
        # Use robust read to support header at row 0 or 3
        check_cols = ['מק"ט', 'פרוייקט', 'פרויקט']
        df = cls._read_excel_robust(contents, check_cols)
        
        df = df.rename(columns=cls.PROJECT_COLUMNS_MAP)
        
        required = ['catalog_number', 'location', 'project', 'quantity']
        missing = [col for col in required if col not in df.columns]
        
        if missing:
             # Translate back mapping for clarity (simplified)
             hebrew_names = {
                 'catalog_number': 'מק"ט',
                 'location': 'מיקום', 
                 'project': 'פרוייקט',
                 'quantity': 'כמות'
             }
             missing_heb = [hebrew_names.get(m, m) for m in missing]
             raise ExcelFileException(f"קובץ ההקצאות אינו תקין. חסרות העמודות הבאות: {', '.join(missing_heb)}")

        df = df.fillna('')
        return df.to_dict('records')

    @staticmethod
    def generate_inventory_excel(items: List[Dict[str, Any]]) -> io.BytesIO:
        """
        Generates an Excel file from a list of item dictionaries.
        Handles column filtering, renaming to Hebrew, and formatting.
        """
        df = pd.DataFrame(items)
        
        column_mapping = {
            'catalog_number': 'מק"ט',
            'description': 'תאור פריט',
            'manufacturer': 'יצרן',
            'location': 'מיקום',
            'serial': 'סריאלי',
            'current_stock': 'מלאי קיים',
            'warranty_expiry': 'תוקף אחריות',
            'reserved_stock': 'מלאי משורין',
            'purpose': 'יעוד',
            'notes': 'הערות'
        }

        # Select only available columns that map to our desired output
        available_columns = [col for col in column_mapping.keys() if col in df.columns]
        df = df[available_columns]
        
        # Rename to Hebrew
        df = df.rename(columns=column_mapping)
        
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='מלאי')
            
            # Auto-adjust column widths (Optional polish)
            worksheet = writer.sheets['מלאי']
            for column_cells in worksheet.columns:
                length = max(len(str(cell.value) or "") for cell in column_cells)
                worksheet.column_dimensions[column_cells[0].column_letter].width = length + 2

        output.seek(0)
        return output
