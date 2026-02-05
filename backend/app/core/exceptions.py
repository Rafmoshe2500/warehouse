from fastapi import HTTPException, status

class ItemNotFoundException(HTTPException):
    def __init__(self, item_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"פריט {item_id} לא נמצא"
        )

class InvalidItemIdException(HTTPException):
    def __init__(self, item_id: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"ID לא תקין: {item_id}"
        )

class UnauthorizedException(HTTPException):
    def __init__(self, detail: str = "שם משתמש או סיסמה שגויים"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail
        )

class DeletePasswordException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="סיסמת מחיקה שגויה"
        )

class DeleteConfirmationException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='יש להקליד "Delete" לאישור'
        )

class ExcelFileException(HTTPException):
    def __init__(self, detail: str = "יש להעלות קובץ Excel בלבד"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


class ForbiddenException(HTTPException):
    def __init__(self, detail: str = "אין לך הרשאה לבצע פעולה זו"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )


class NotFoundException(HTTPException):
    def __init__(self, detail: str = "לא נמצא"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )


class BadRequestException(HTTPException):
    def __init__(self, detail: str = "בקשה לא תקינה"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )

