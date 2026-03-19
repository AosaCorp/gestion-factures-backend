import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

interface SearchBarProps {
  onSearch: (term: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = 'Rechercher...' }) => {
  const [term, setTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(term);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTerm(e.target.value);
    // Optionnel : recherche en temps réel après un délai
    // mais pour éviter trop de requêtes, on attend la soumission
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center">
      <input
        type="text"
        value={term}
        onChange={handleChange}
        placeholder={placeholder}
        className="border border-gray-300 rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 flex items-center"
      >
        <FiSearch className="mr-1" /> Rechercher
      </button>
    </form>
  );
};

export default SearchBar;