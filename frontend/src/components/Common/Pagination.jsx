import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  // Page numbers ka array banate hain (e.g., [1, 2, 3, 4, 5])
  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      // Sirf current page ke aas-paas ke pages dikhayenge
      if (
        i === 1 || 
        i === totalPages || 
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (
        i === currentPage - 2 || 
        i === currentPage + 2
      ) {
        pages.push('...');
      }
    }
    return pages;
  };

  return (
    <div className="pagination-container">
      <button 
        className="page-btn" 
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <FiChevronLeft /> Prev
      </button>

      <div className="page-numbers">
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            className={`page-number ${page === currentPage ? 'active' : ''} ${page === '...' ? 'dots' : ''}`}
            onClick={() => page !== '...' && onPageChange(page)}
            disabled={page === '...'}
          >
            {page}
          </button>
        ))}
      </div>

      <button 
        className="page-btn" 
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next <FiChevronRight />
      </button>
    </div>
  );
};

export default Pagination;