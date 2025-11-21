import React, { useState, useEffect } from 'react';
import Navbar from '../Layout/Navbar';
import axios from 'axios';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi';
import './Expenses.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Other'];

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: 'Other',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchExpenses();
  }, [filterCategory]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterCategory) params.category = filterCategory;
      const response = await axios.get(`${API_URL}/expenses`, { params });
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const amountNumber = parseFloat(formData.amount);
    if (!formData.amount || Number.isNaN(amountNumber) || amountNumber <= 0) {
      newErrors.amount = 'Please enter an amount greater than 0.';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please enter a description for this expense.';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category.';
    }

    if (!formData.date) {
      newErrors.date = 'Please select a valid date.';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      selectedDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (selectedDate > today) {
        newErrors.date = 'Expense date cannot be in the future.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (editingExpense) {
        await axios.put(`${API_URL}/expenses/${editingExpense._id}`, formData);
      } else {
        await axios.post(`${API_URL}/expenses`, formData);
      }
      fetchExpenses();
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Error saving expense. Please try again.');
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount.toString(),
      description: expense.description,
      category: expense.category,
      date: new Date(expense.date).toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await axios.delete(`${API_URL}/expenses/${id}`);
        fetchExpenses();
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Error deleting expense. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      category: 'Other',
      date: new Date().toISOString().split('T')[0]
    });
    setEditingExpense(null);
    setErrors({});
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <>
      <Navbar />
      <div className="expenses-page">
        <div className="expenses-header">
          <h1>Expenses</h1>
          <button className="add-button" onClick={() => { resetForm(); setShowModal(true); }}>
            <FiPlus /> Add Expense
          </button>
        </div>

        <div className="expenses-filters">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-box">
            <FiFilter />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="expenses-summary">
          <div className="summary-card">
            <span className="summary-label">Total Expenses</span>
            <span className="summary-value">${totalAmount.toFixed(2)}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Total Transactions</span>
            <span className="summary-value">{filteredExpenses.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading expenses...</div>
        ) : (
          <div className="expenses-list">
            {filteredExpenses.length === 0 ? (
              <div className="no-expenses">
                <p>No expenses found. Add your first expense to get started!</p>
              </div>
            ) : (
              filteredExpenses.map(expense => (
                <div key={expense._id} className="expense-card">
                  <div className="expense-main">
                    <div className="expense-category-badge" data-category={expense.category}>
                      {expense.category}
                    </div>
                    <div className="expense-details">
                      <h3>{expense.description}</h3>
                      <p className="expense-date">
                        {new Date(expense.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="expense-amount">${expense.amount.toFixed(2)}</div>
                  </div>
                  <div className="expense-actions">
                    <button onClick={() => handleEdit(expense)} className="edit-btn">
                      <FiEdit2 /> Edit
                    </button>
                    <button onClick={() => handleDelete(expense._id)} className="delete-btn">
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
              <form onSubmit={handleSubmit} noValidate>
                <div className={`form-group ${errors.amount ? 'has-error' : ''}`}>
                  <label>Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => {
                      setFormData({ ...formData, amount: e.target.value });
                      if (errors.amount) {
                        setErrors(prev => ({ ...prev, amount: undefined }));
                      }
                    }}
                  />
                  {errors.amount && <div className="field-error">{errors.amount}</div>}
                </div>
                <div className={`form-group ${errors.description ? 'has-error' : ''}`}>
                  <label>Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      if (errors.description) {
                        setErrors(prev => ({ ...prev, description: undefined }));
                      }
                    }}
                  />
                  {errors.description && <div className="field-error">{errors.description}</div>}
                </div>
                <div className={`form-group ${errors.category ? 'has-error' : ''}`}>
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      setFormData({ ...formData, category: e.target.value });
                      if (errors.category) {
                        setErrors(prev => ({ ...prev, category: undefined }));
                      }
                    }}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {errors.category && <div className="field-error">{errors.category}</div>}
                </div>
                <div className={`form-group ${errors.date ? 'has-error' : ''}`}>
                  <label>Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => {
                      setFormData({ ...formData, date: e.target.value });
                      if (errors.date) {
                        setErrors(prev => ({ ...prev, date: undefined }));
                      }
                    }}
                  />
                  {errors.date && <div className="field-error">{errors.date}</div>}
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="cancel-btn">
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    {editingExpense ? 'Update' : 'Add'} Expense
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Expenses;



