import React, { useState, useEffect } from 'react';
import Navbar from '../Layout/Navbar';
import axios from 'axios';
import { FiPlus, FiEdit2, FiTrash2, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import './Budgets.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Other'];
const PERIODS = ['Weekly', 'Monthly', 'Yearly'];

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [budgetStatuses, setBudgetStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    category: 'Other',
    amount: '',
    period: 'Monthly',
    startDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchBudgets();
  }, []);

  useEffect(() => {
    if (budgets.length > 0) {
      fetchBudgetStatuses();
    }
  }, [budgets]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/budgets`);
      setBudgets(response.data);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgetStatuses = async () => {
    const statusPromises = budgets.map(budget =>
      axios.get(`${API_URL}/budgets/${budget._id}/status`)
    );

    try {
      const responses = await Promise.all(statusPromises);
      const statusMap = {};
      responses.forEach((response, index) => {
        statusMap[budgets[index]._id] = response.data;
      });
      setBudgetStatuses(statusMap);
    } catch (error) {
      console.error('Error fetching budget statuses:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const amountNumber = parseFloat(formData.amount);
    if (!formData.amount || Number.isNaN(amountNumber) || amountNumber <= 0) {
      newErrors.amount = 'Please enter a budget amount greater than 0.';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category.';
    }

    if (!formData.period) {
      newErrors.period = 'Please select a period.';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Please select a valid start date.';
    } else {
      const selectedDate = new Date(formData.startDate);
      const today = new Date();
      selectedDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.startDate = 'Start date cannot be in the past.';
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
      if (editingBudget) {
        await axios.put(`${API_URL}/budgets/${editingBudget._id}`, formData);
      } else {
        await axios.post(`${API_URL}/budgets`, formData);
      }
      fetchBudgets();
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Error saving budget. Please try again.');
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period,
      startDate: new Date(budget.startDate).toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await axios.delete(`${API_URL}/budgets/${id}`);
        fetchBudgets();
      } catch (error) {
        console.error('Error deleting budget:', error);
        alert('Error deleting budget. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      category: 'Other',
      amount: '',
      period: 'Monthly',
      startDate: new Date().toISOString().split('T')[0]
    });
    setEditingBudget(null);
    setErrors({});
  };

  const getBudgetStatus = (budgetId) => {
    return budgetStatuses[budgetId] || null;
  };

  return (
    <>
      <Navbar />
      <div className="budgets-page">
        <div className="budgets-header">
          <h1>Budgets</h1>
          <button className="add-button" onClick={() => { resetForm(); setShowModal(true); }}>
            <FiPlus /> Add Budget
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading budgets...</div>
        ) : (
          <div className="budgets-list">
            {budgets.length === 0 ? (
              <div className="no-budgets">
                <p>No budgets set. Create a budget to start tracking your spending limits!</p>
              </div>
            ) : (
              budgets.map(budget => {
                const status = getBudgetStatus(budget._id);
                const percentage = status ? Math.min(status.percentage, 100) : 0;
                const isOverBudget = status?.isOverBudget || false;

                return (
                  <div key={budget._id} className="budget-card">
                    <div className="budget-header">
                      <div className="budget-category-badge" data-category={budget.category}>
                        {budget.category}
                      </div>
                      <div className="budget-actions">
                        <button onClick={() => handleEdit(budget)} className="edit-btn">
                          <FiEdit2 /> Edit
                        </button>
                        <button onClick={() => handleDelete(budget._id)} className="delete-btn">
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                    </div>

                    <div className="budget-info">
                      <div className="budget-amounts">
                        <div className="budget-item">
                          <span className="budget-label">Budget Limit</span>
                          <span className="budget-value">${budget.amount.toFixed(2)}</span>
                        </div>
                        {status && (
                          <>
                            <div className="budget-item">
                              <span className="budget-label">Spent</span>
                              <span className={`budget-value ${isOverBudget ? 'over-budget' : ''}`}>
                                ${status.spent.toFixed(2)}
                              </span>
                            </div>
                            <div className="budget-item">
                              <span className="budget-label">Remaining</span>
                              <span className={`budget-value ${status.remaining < 0 ? 'over-budget' : ''}`}>
                                ${status.remaining.toFixed(2)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="budget-period">
                        <span>Period: {budget.period}</span>
                        <span>Started: {new Date(budget.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {status && (
                      <div className="budget-progress">
                        <div className="progress-bar-container">
                          <div
                            className={`progress-bar ${isOverBudget ? 'over-budget' : ''}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="progress-info">
                          <span>{percentage.toFixed(1)}% used</span>
                          {isOverBudget ? (
                            <span className="over-budget-warning">
                              <FiAlertCircle /> Over Budget
                            </span>
                          ) : (
                            <span className="on-track">
                              <FiCheckCircle /> On Track
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>{editingBudget ? 'Edit Budget' : 'Create New Budget'}</h2>
              <form onSubmit={handleSubmit} noValidate>
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
                <div className={`form-group ${errors.period ? 'has-error' : ''}`}>
                  <label>Period</label>
                  <select
                    value={formData.period}
                    onChange={(e) => {
                      setFormData({ ...formData, period: e.target.value });
                      if (errors.period) {
                        setErrors(prev => ({ ...prev, period: undefined }));
                      }
                    }}
                  >
                    {PERIODS.map(period => (
                      <option key={period} value={period}>{period}</option>
                    ))}
                  </select>
                  {errors.period && <div className="field-error">{errors.period}</div>}
                </div>
                <div className={`form-group ${errors.startDate ? 'has-error' : ''}`}>
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => {
                      setFormData({ ...formData, startDate: e.target.value });
                      if (errors.startDate) {
                        setErrors(prev => ({ ...prev, startDate: undefined }));
                      }
                    }}
                  />
                  {errors.startDate && <div className="field-error">{errors.startDate}</div>}
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="cancel-btn">
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    {editingBudget ? 'Update' : 'Create'} Budget
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

export default Budgets;



