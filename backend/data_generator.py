import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
from faker import Faker
import json

fake = Faker()
random.seed(42)
np.random.seed(42)

class FinancialDataGenerator:
    def __init__(self):
        self.categories = {
            'expense': {
                'Housing': {'weight': 0.30, 'min': 800, 'max': 2500},
                'Food': {'weight': 0.15, 'min': 200, 'max': 800},
                'Transportation': {'weight': 0.12, 'min': 100, 'max': 600},
                'Utilities': {'weight': 0.08, 'min': 80, 'max': 300},
                'Healthcare': {'weight': 0.06, 'min': 50, 'max': 500},
                'Entertainment': {'weight': 0.10, 'min': 50, 'max': 400},
                'Shopping': {'weight': 0.08, 'min': 30, 'max': 600},
                'Education': {'weight': 0.05, 'min': 0, 'max': 300},
                'Travel': {'weight': 0.04, 'min': 0, 'max': 1000},
                'Other': {'weight': 0.02, 'min': 10, 'max': 200}
            },
            'income': {
                'Salary': {'weight': 0.80, 'min': 3000, 'max': 8000},
                'Freelance': {'weight': 0.10, 'min': 200, 'max': 2000},
                'Investment': {'weight': 0.07, 'min': 50, 'max': 1000},
                'Bonus': {'weight': 0.03, 'min': 500, 'max': 3000}
            }
        }
        
        self.descriptions = {
            'Housing': ['Rent payment', 'Mortgage payment', 'Property tax', 'Home insurance', 'HOA fees'],
            'Food': ['Grocery shopping', 'Restaurant dining', 'Food delivery', 'Coffee shop', 'Lunch'],
            'Transportation': ['Gas station', 'Public transport', 'Uber/Lyft', 'Car maintenance', 'Parking'],
            'Utilities': ['Electricity bill', 'Water bill', 'Internet', 'Phone bill', 'Gas bill'],
            'Healthcare': ['Doctor visit', 'Pharmacy', 'Health insurance', 'Dental care', 'Gym membership'],
            'Entertainment': ['Movie tickets', 'Streaming services', 'Concert tickets', 'Gaming', 'Books'],
            'Shopping': ['Clothing', 'Electronics', 'Home goods', 'Personal care', 'Gifts'],
            'Education': ['Course fees', 'Books', 'Online learning', 'Certification', 'Workshop'],
            'Travel': ['Flight tickets', 'Hotel booking', 'Car rental', 'Travel insurance', 'Vacation'],
            'Other': ['Miscellaneous', 'ATM fees', 'Bank charges', 'Subscriptions', 'Donations'],
            'Salary': ['Monthly salary', 'Bi-weekly paycheck', 'Weekly wages'],
            'Freelance': ['Freelance project', 'Consulting work', 'Side hustle'],
            'Investment': ['Dividend payment', 'Stock sale', 'Bond interest', 'Rental income'],
            'Bonus': ['Performance bonus', 'Holiday bonus', 'Commission', 'Tax refund']
        }

    def generate_users(self, num_users=100):
        """Generate sample users with realistic profiles"""
        users = []
        for i in range(num_users):
            age = random.randint(22, 65)
            # Income based on age (career progression)
            base_income = 30000 + (age - 22) * 1500 + random.randint(-10000, 20000)
            base_income = max(25000, min(120000, base_income))
            
            user = {
                'id': i + 1,
                'name': fake.name(),
                'email': fake.email(),
                'age': age,
                'annual_income': base_income,
                'monthly_income': base_income / 12,
                'created_at': fake.date_between(start_date='-2y', end_date='now')
            }
            users.append(user)
        return pd.DataFrame(users)

    def generate_transactions(self, users_df, start_date='2022-01-01', end_date='2024-12-31'):
        """Generate realistic financial transactions for all users"""
        transactions = []
        
        for _, user in users_df.iterrows():
            current_date = datetime.strptime(start_date, '%Y-%m-%d')
            end_dt = datetime.strptime(end_date, '%Y-%m-%d')
            
            monthly_income = user['monthly_income']
            
            while current_date <= end_dt:
                # Generate monthly salary (with some variation)
                if random.random() < 0.95:  # 95% chance of getting salary each month
                    salary_amount = monthly_income * random.uniform(0.95, 1.05)
                    transactions.append({
                        'user_id': user['id'],
                        'amount': round(salary_amount, 2),
                        'category': 'Salary',
                        'description': random.choice(self.descriptions['Salary']),
                        'transaction_date': current_date.strftime('%Y-%m-%d'),
                        'transaction_type': 'income'
                    })
                
                # Generate expenses for the month
                monthly_expenses = self._generate_monthly_expenses(monthly_income)
                for expense in monthly_expenses:
                    # Spread expenses throughout the month
                    expense_date = current_date + timedelta(days=random.randint(0, 28))
                    if expense_date <= end_dt:
                        transactions.append({
                            'user_id': user['id'],
                            'amount': expense['amount'],
                            'category': expense['category'],
                            'description': expense['description'],
                            'transaction_date': expense_date.strftime('%Y-%m-%d'),
                            'transaction_type': 'expense'
                        })
                
                # Generate occasional additional income
                if random.random() < 0.15:  # 15% chance of additional income
                    income_types = ['Freelance', 'Investment', 'Bonus']
                    income_type = random.choice(income_types)
                    income_range = self.categories['income'][income_type]
                    amount = random.uniform(income_range['min'], income_range['max'])
                    
                    transactions.append({
                        'user_id': user['id'],
                        'amount': round(amount, 2),
                        'category': income_type,
                        'description': random.choice(self.descriptions[income_type]),
                        'transaction_date': (current_date + timedelta(days=random.randint(0, 28))).strftime('%Y-%m-%d'),
                        'transaction_type': 'income'
                    })
                
                # Move to next month
                if current_date.month == 12:
                    current_date = current_date.replace(year=current_date.year + 1, month=1)
                else:
                    current_date = current_date.replace(month=current_date.month + 1)
        
        return pd.DataFrame(transactions)

    def _generate_monthly_expenses(self, monthly_income):
        """Generate realistic monthly expenses based on income"""
        expenses = []
        total_budget = monthly_income * random.uniform(0.7, 0.95)  # Spend 70-95% of income
        
        for category, details in self.categories['expense'].items():
            # Calculate budget for this category
            category_budget = total_budget * details['weight']
            
            # Add some randomness to spending
            actual_spending = category_budget * random.uniform(0.5, 1.3)
            actual_spending = max(details['min'], min(details['max'], actual_spending))
            
            # Create 1-5 transactions for this category
            num_transactions = random.randint(1, min(5, int(actual_spending / 50) + 1))
            amounts = self._split_amount(actual_spending, num_transactions)
            
            for amount in amounts:
                if amount > 10:  # Only include meaningful transactions
                    expenses.append({
                        'amount': round(amount, 2),
                        'category': category,
                        'description': random.choice(self.descriptions[category])
                    })
        
        return expenses

    def _split_amount(self, total_amount, num_parts):
        """Split an amount into random parts"""
        if num_parts == 1:
            return [total_amount]
        
        splits = sorted([random.uniform(0, 1) for _ in range(num_parts - 1)])
        splits = [0] + splits + [1]
        
        amounts = []
        for i in range(len(splits) - 1):
            amount = total_amount * (splits[i + 1] - splits[i])
            amounts.append(amount)
        
        return amounts

    def generate_budgets(self, users_df):
        """Generate budget allocations for users"""
        budgets = []
        
        for _, user in users_df.iterrows():
            monthly_income = user['monthly_income']
            
            for category, details in self.categories['expense'].items():
                # Set budget as percentage of income with some variation
                budget_amount = monthly_income * details['weight'] * random.uniform(0.8, 1.2)
                budget_amount = max(details['min'], min(details['max'], budget_amount))
                
                budgets.append({
                    'user_id': user['id'],
                    'category': category,
                    'monthly_limit': round(budget_amount, 2)
                })
        
        return pd.DataFrame(budgets)

    def generate_savings_goals(self, users_df):
        """Generate savings goals for users"""
        goals = []
        goal_types = [
            {'name': 'Emergency Fund', 'min': 3000, 'max': 15000, 'months': 12},
            {'name': 'Vacation', 'min': 1000, 'max': 8000, 'months': 6},
            {'name': 'Car Purchase', 'min': 5000, 'max': 30000, 'months': 18},
            {'name': 'House Down Payment', 'min': 15000, 'max': 80000, 'months': 36},
            {'name': 'Wedding', 'min': 5000, 'max': 25000, 'months': 12}
        ]
        
        for _, user in users_df.iterrows():
            # Each user has 1-3 goals
            num_goals = random.randint(1, 3)
            user_goals = random.sample(goal_types, num_goals)
            
            for goal in user_goals:
                target_amount = random.uniform(goal['min'], goal['max'])
                current_amount = target_amount * random.uniform(0, 0.7)  # 0-70% progress
                
                target_date = datetime.now() + timedelta(days=goal['months'] * 30)
                
                goals.append({
                    'user_id': user['id'],
                    'goal_name': goal['name'],
                    'target_amount': round(target_amount, 2),
                    'current_amount': round(current_amount, 2),
                    'target_date': target_date.strftime('%Y-%m-%d')
                })
        
        return pd.DataFrame(goals)

    def generate_investments(self, users_df):
        """Generate investment portfolio data"""
        investments = []
        investment_types = [
            {'type': 'Stocks', 'min': 500, 'max': 10000, 'volatility': 0.15},
            {'type': 'Bonds', 'min': 1000, 'max': 20000, 'volatility': 0.05},
            {'type': 'ETFs', 'min': 300, 'max': 15000, 'volatility': 0.12},
            {'type': 'Crypto', 'min': 100, 'max': 5000, 'volatility': 0.30},
            {'type': 'Real Estate', 'min': 10000, 'max': 100000, 'volatility': 0.08}
        ]
        
        for _, user in users_df.iterrows():
            # Not all users have investments
            if random.random() < 0.7:  # 70% of users have investments
                num_investments = random.randint(1, 4)
                
                for _ in range(num_investments):
                    investment = random.choice(investment_types)
                    initial_amount = random.uniform(investment['min'], investment['max'])
                    
                    # Calculate current value with some market performance
                    performance = random.uniform(-0.2, 0.4)  # -20% to +40% return
                    current_value = initial_amount * (1 + performance)
                    
                    purchase_date = fake.date_between(start_date='-2y', end_date='-1m')
                    
                    investments.append({
                        'user_id': user['id'],
                        'investment_type': investment['type'],
                        'amount': round(initial_amount, 2),
                        'current_value': round(current_value, 2),
                        'purchase_date': purchase_date.strftime('%Y-%m-%d')
                    })
        
        return pd.DataFrame(investments)

    def generate_all_data(self, num_users=50):
        """Generate complete dataset"""
        print("Generating users...")
        users_df = self.generate_users(num_users)
        
        print("Generating transactions...")
        transactions_df = self.generate_transactions(users_df)
        
        print("Generating budgets...")
        budgets_df = self.generate_budgets(users_df)
        
        print("Generating savings goals...")
        goals_df = self.generate_savings_goals(users_df)
        
        print("Generating investments...")
        investments_df = self.generate_investments(users_df)
        
        # Save to CSV files
        users_df.to_csv('users.csv', index=False)
        transactions_df.to_csv('transactions.csv', index=False)
        budgets_df.to_csv('budgets.csv', index=False)
        goals_df.to_csv('savings_goals.csv', index=False)
        investments_df.to_csv('investments.csv', index=False)
        
        print(f"\nData generation complete!")
        print(f"Users: {len(users_df)}")
        print(f"Transactions: {len(transactions_df)}")
        print(f"Budgets: {len(budgets_df)}")
        print(f"Goals: {len(goals_df)}")
        print(f"Investments: {len(investments_df)}")
        
        return {
            'users': users_df,
            'transactions': transactions_df,
            'budgets': budgets_df,
            'goals': goals_df,
            'investments': investments_df
        }

if __name__ == "__main__":
    generator = FinancialDataGenerator()
    data = generator.generate_all_data(num_users=100)