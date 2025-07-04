from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, timedelta
import numpy as np
from ..models import User, Transaction, Budget, SavingsGoal, Investment
from ..schemas import FinancialHealthScore, SpendingAnalysis

class AnalyticsService:
    @staticmethod
    def calculate_financial_health_score(user_id: int, db: Session) -> FinancialHealthScore:
        """Calculate comprehensive financial health score"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get recent transactions (last 6 months)
        six_months_ago = datetime.now() - timedelta(days=180)
        
        transactions = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_date >= six_months_ago.date()
        ).all()
        
        if not transactions:
            return FinancialHealthScore(
                score=50,
                category="Insufficient Data",
                recommendations=["Add more transactions to get accurate scoring"]
            )
        
        # Calculate metrics
        income_transactions = [t for t in transactions if t.transaction_type == 'income']
        expense_transactions = [t for t in transactions if t.transaction_type == 'expense']
        
        total_income = sum(t.amount for t in income_transactions)
        total_expenses = sum(t.amount for t in expense_transactions)
        
        # Score components (0-100 each)
        scores = {}
        recommendations = []
        
        # 1. Savings Rate (30% weight)
        if total_income > 0:
            savings_rate = (total_income - total_expenses) / total_income
            if savings_rate >= 0.20:
                scores['savings'] = 100
            elif savings_rate >= 0.10:
                scores['savings'] = 75
            elif savings_rate >= 0.05:
                scores['savings'] = 50
            elif savings_rate >= 0:
                scores['savings'] = 25
                recommendations.append("Try to save at least 10% of your income")
            else:
                scores['savings'] = 0
                recommendations.append("You're spending more than you earn - review your expenses")
        else:
            scores['savings'] = 0
        
        # 2. Budget Adherence (25% weight)
        budgets = db.query(Budget).filter(Budget.user_id == user_id).all()
        if budgets:
            adherence_scores = []
            for budget in budgets:
                category_expenses = sum(t.amount for t in expense_transactions if t.category == budget.category)
                monthly_budget = budget.monthly_limit * 6  # 6 months
                if monthly_budget > 0:
                    adherence = min(100, (1 - max(0, (category_expenses - monthly_budget) / monthly_budget)) * 100)
                    adherence_scores.append(adherence)
            
            if adherence_scores:
                scores['budget'] = sum(adherence_scores) / len(adherence_scores)
                if scores['budget'] < 70:
                    recommendations.append("You're exceeding budgets in some categories")
            else:
                scores['budget'] = 50
        else:
            scores['budget'] = 25
            recommendations.append("Set up budgets for better financial control")
        
        # 3. Emergency Fund (20% weight)
        goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).all()
        emergency_fund = next((g for g in goals if 'emergency' in g.goal_name.lower()), None)
        
        if emergency_fund:
            monthly_expenses = total_expenses / 6  # Average monthly expenses
            if monthly_expenses > 0:
                months_covered = emergency_fund.current_amount / monthly_expenses
                if months_covered >= 6:
                    scores['emergency'] = 100
                elif months_covered >= 3:
                    scores['emergency'] = 75
                elif months_covered >= 1:
                    scores['emergency'] = 50
                else:
                    scores['emergency'] = 25
                    recommendations.append("Build an emergency fund covering 3-6 months of expenses")
            else:
                scores['emergency'] = 50
        else:
            scores['emergency'] = 0
            recommendations.append("Create an emergency fund goal")
        
        # 4. Investment Diversification (15% weight)
        investments = db.query(Investment).filter(Investment.user_id == user_id).all()
        if investments:
            investment_types = set(inv.investment_type for inv in investments)
            diversification_score = min(100, len(investment_types) * 25)  # Max 4 types for 100%
            scores['investment'] = diversification_score
            
            if diversification_score < 50:
                recommendations.append("Consider diversifying your investment portfolio")
        else:
            scores['investment'] = 0
            recommendations.append("Consider starting an investment portfolio")
        
        # 5. Spending Consistency (10% weight)
        monthly_expenses = {}
        for transaction in expense_transactions:
            month_key = transaction.transaction_date.strftime('%Y-%m')
            monthly_expenses[month_key] = monthly_expenses.get(month_key, 0) + transaction.amount
        
        if len(monthly_expenses) >= 2:
            expense_values = list(monthly_expenses.values())
            consistency = 100 - (np.std(expense_values) / np.mean(expense_values) * 100)
            scores['consistency'] = max(0, min(100, consistency))
        else:
            scores['consistency'] = 50
        
        # Calculate weighted final score
        weights = {
            'savings': 0.30,
            'budget': 0.25,
            'emergency': 0.20,
            'investment': 0.15,
            'consistency': 0.10
        }
        
        final_score = sum(scores[key] * weights[key] for key in scores)
        final_score = int(round(final_score))
        
        # Determine category
        if final_score >= 80:
            category = "Excellent"
        elif final_score >= 70:
            category = "Good"
        elif final_score >= 60:
            category = "Fair"
        elif final_score >= 50:
            category = "Needs Improvement"
        else:
            category = "Poor"
        
        # Add general recommendations
        if final_score < 70:
            recommendations.append("Consider consulting with a financial advisor")
        if not recommendations:
            recommendations.append("Keep up the great work with your finances!")
        
        return FinancialHealthScore(
            score=final_score,
            category=category,
            recommendations=recommendations[:5]  # Limit to 5 recommendations
        )
    
    @staticmethod
    def get_spending_analysis(user_id: int, db: Session) -> SpendingAnalysis:
        """Get comprehensive spending analysis"""
        # Get transactions from last 12 months
        twelve_months_ago = datetime.now() - timedelta(days=365)
        
        transactions = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_date >= twelve_months_ago.date()
        ).all()
        
        income_transactions = [t for t in transactions if t.transaction_type == 'income']
        expense_transactions = [t for t in transactions if t.transaction_type == 'expense']
        
        total_income = sum(t.amount for t in income_transactions)
        total_expenses = sum(t.amount for t in expense_transactions)
        
        savings_rate = (total_income - total_expenses) / total_income if total_income > 0 else 0
        
        # Top spending categories
        category_totals = {}
        for transaction in expense_transactions:
            category_totals[transaction.category] = category_totals.get(transaction.category, 0) + transaction.amount
        
        top_categories = [
            {"category": cat, "amount": amount, "percentage": (amount/total_expenses)*100 if total_expenses > 0 else 0}
            for cat, amount in sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:5]
        ]
        
        # Monthly trends
        monthly_data = {}
        for transaction in transactions:
            month_key = transaction.transaction_date.strftime('%Y-%m')
            if month_key not in monthly_data:
                monthly_data[month_key] = {'income': 0, 'expenses': 0}
            
            if transaction.transaction_type == 'income':
                monthly_data[month_key]['income'] += transaction.amount
            else:
                monthly_data[month_key]['expenses'] += transaction.amount
        
        monthly_trends = [
            {
                "month": month,
                "income": data['income'],
                "expenses": data['expenses'],
                "net": data['income'] - data['expenses']
            }
            for month, data in sorted(monthly_data.items())
        ]
        
        return SpendingAnalysis(
            total_income=total_income,
            total_expenses=total_expenses,
            savings_rate=savings_rate,
            top_categories=top_categories,
            monthly_trends=monthly_trends
        )