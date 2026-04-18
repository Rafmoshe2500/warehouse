import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal/Modal';
import Spinner from '../../common/Spinner/Spinner';
import itemService from '../../../api/services/itemService';
import './AssociatedCollectionsModal.css';

const AssociatedCollectionsModal = ({ isOpen, onClose, item }) => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCollections = async () => {
      if (isOpen && item) {
        setLoading(true);
        setError(null);
        try {
          const data = await itemService.getItemCollections(item._id || item.id);
          setCollections(data);
        } catch (err) {
          console.error("Failed to fetch collections", err);
          setError("שגיאה בטעינת הנתונים");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCollections();
  }, [isOpen, item]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`צוותים משוייכים - ${item?.product_name || item?.catalog_number || 'פריט'}`}
      size="medium"
    >
      <div className="associated-collections-content">
        {loading ? (
          <Spinner message="טוען נתונים..." />
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : collections.length === 0 ? (
          <div className="empty-state">פריט זה לא משוייך לשום צוות.</div>
        ) : (
          <table className="collections-table">
            <thead>
              <tr>
                <th>שם האוסף/צוות</th>
                <th>בעלים</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((col) => (
                <tr key={col.collection_id || col.collection_name}>
                  <td>{col.collection_name}</td>
                  <td className="ltr-text">{col.owner_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Modal>
  );
};

export default AssociatedCollectionsModal;
