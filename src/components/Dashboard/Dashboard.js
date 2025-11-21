import React, { useState, useEffect } from 'react';
import Navbar from '../Layout/Navbar';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiTrendingUp, FiDollarSign, FiTarget, FiAlertCircle } from 'react-icons/fi';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      let startDate, endDate;

      switch (timeRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = now;
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = now;
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = now;
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = now;
      }

      const [statsRes, expensesRes, budgetsRes] = await Promise.all([
        axios.get(`${API_URL}/expenses/stats/summary`, {
          params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
        }),
        axios.get(`${API_URL}/expenses`, {
          params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
        }),
        axios.get(`${API_URL}/budgets`)
      ]);

      setStats(statsRes.data);
      setExpenses(expensesRes.data);
      setBudgets(budgetsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareCategoryData = () => {
    if (!stats?.byCategory) return [];
    return Object.entries(stats.byCategory).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    }));
  };

  const prepareMonthlyData = () => {
    const monthlyData = {};
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey] += expense.amount;
    });

    return Object.entries(monthlyData)
      .map(([month, amount]) => ({
        month: month.split('-')[1],
        amount: parseFloat(amount.toFixed(2))
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="dashboard-loading">Loading dashboard...</div>
      </>
    );
  }

  const categoryData = prepareCategoryData();
  const monthlyData = prepareMonthlyData();

  return (
    <>
      <Navbar />
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <div className="time-range-selector">
            <button
              className={timeRange === 'week' ? 'active' : ''}
              onClick={() => setTimeRange('week')}
            >
              Week
            </button>
            <button
              className={timeRange === 'month' ? 'active' : ''}
              onClick={() => setTimeRange('month')}
            >
              Month
            </button>
            <button
              className={timeRange === 'year' ? 'active' : ''}
              onClick={() => setTimeRange('year')}
            >
              Year
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <FiDollarSign />
            </div>
            <div className="stat-content">
              <h3>Total Spent</h3>
              <p className="stat-value">${stats?.total?.toFixed(2) || '0.00'}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <FiTrendingUp />
            </div>
            <div className="stat-content">
              <h3>Transactions</h3>
              <p className="stat-value">{stats?.count || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <FiTarget />
            </div>
            <div className="stat-content">
              <h3>Average</h3>
              <p className="stat-value">${stats?.average?.toFixed(2) || '0.00'}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
              <FiAlertCircle />
            </div>
            <div className="stat-content">
              <h3>Budgets</h3>
              <p className="stat-value">{budgets.length}</p>
            </div>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <h2>Spending by Category</h2>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No expenses to display</div>
            )}
          </div>

          <div className="chart-card">
            <h2>Monthly Spending Trend</h2>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="amount" fill="#667eea" name="Amount Spent" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No expenses to display</div>
            )}
          </div>
        </div>

        <div className="recent-expenses">
          <h2>Recent Expenses</h2>
          {expenses.length > 0 ? (
            <div className="expenses-list">
              {expenses.slice(0, 5).map(expense => (
                <div key={expense._id} className="expense-item">
                  <div className="expense-info">
                    <span className="expense-category">{expense.category}</span>
                    <span className="expense-description">{expense.description}</span>
                    <span className="expense-date">
                      {new Date(expense.date).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="expense-amount">${expense.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">No recent expenses</div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;



