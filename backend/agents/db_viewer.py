#!/usr/bin/env python3
"""
MNH Database Viewer
Connects to the live database and prints all table contents.
Run from project root: python agents/db_viewer.py
"""

import sys
import os
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_path = os.path.join(project_root, 'backend')
sys.path.insert(0, backend_path)
sys.path.insert(0, project_root)

from app import create_app
app = create_app()

def print_separator(title=""):
    print("\n" + "="*70)
    if title:
        print(f"  {title}")
        print("="*70)

def print_table_data(model_class, label, fields):
    """
    Print rows from a SQLAlchemy model.
    model_class: the SQLAlchemy model
    label: display name for the table
    fields: list of field names to display
    """
    try:
        rows = model_class.query.limit(10).all()
        total = model_class.query.count()
        
        print_separator(f"TABLE: {label}  (total rows: {total})")
        
        if total == 0:
            print("  [EMPTY TABLE]")
            return 0
        
        # Print header
        header = " | ".join(f"{f:<20}" for f in fields)
        print(header)
        print("-" * len(header))
        
        # Print rows
        for row in rows:
            values = []
            for f in fields:
                val = getattr(row, f, "N/A")
                values.append(str(val)[:20] if val is not None else "NULL")
            print(" | ".join(f"{v:<20}" for v in values))
        
        if total > 10:
            print(f"  ... and {total - 10} more rows")
        
        return total
        
    except Exception as e:
        print(f"  ERROR reading {label}: {str(e)}")
        return 0


def main():
    print_separator("MNH DATABASE VIEWER")
    print(f"  Connecting to database...")
    
    with app.app_context():
        
        # ── Print DB connection info ───────────────────────────────────
        try:
            from flask import current_app
            db_url = str(current_app.config.get('SQLALCHEMY_DATABASE_URI', 'Not configured'))
            # Mask password in URL for display
            if '@' in db_url:
                parts = db_url.split('@')
                credentials = parts[0].split('//')[-1]
                if ':' in credentials:
                    user = credentials.split(':')[0]
                    masked = db_url.replace(credentials, f"{user}:****")
                else:
                    masked = db_url
            else:
                masked = db_url
            print(f"  Database URL: {masked}")
        except Exception as e:
            print(f"  Could not read DB URL: {e}")

        total_rows = 0
        table_count = 0

        # PATIENT TABLE
        try:
            from models.patient import Patient
            total_rows += print_table_data(
                Patient,
                "PATIENTS",
                ["id", "user_id", "age", "gender", "emergency_contact", "conditions"]
            )
            table_count += 1
        except ImportError as e:
            print(f"\n  [SKIP] Patient model not found: {e}")

        # STAFF TABLE (Doctors etc)
        try:
            from models.staff import Staff
            total_rows += print_table_data(
                Staff,
                "STAFF",
                ["id", "name", "role", "department", "status"]
            )
            table_count += 1
        except ImportError as e:
            print(f"\n  [SKIP] Staff model not found: {e}")

        # APPOINTMENT TABLE
        try:
            from models.appointment import Appointment
            total_rows += print_table_data(
                Appointment,
                "APPOINTMENTS",
                ["id", "patient_id", "doctor_name", "date", "status"]
            )
            table_count += 1
        except ImportError as e:
            print(f"\n  [SKIP] Appointment model not found: {e}")

        # BILLING TABLE
        try:
            from models.billing import Billing
            total_rows += print_table_data(
                Billing,
                "BILLING",
                ["id", "patient_id", "total", "status", "created_at"]
            )
            table_count += 1
        except ImportError as e:
            print(f"\n  [SKIP] Billing model not found: {e}")

        # PAYMENT TABLE
        try:
            from models.payment import Payment
            total_rows += print_table_data(
                Payment,
                "PAYMENTS",
                ["id", "billing_id", "amount", "method", "status"]
            )
            table_count += 1
        except ImportError as e:
            print(f"\n  [SKIP] Payment model not found: {e}")

        # BED TABLE
        try:
            from models.bed import Bed
            total_rows += print_table_data(
                Bed,
                "BEDS",
                ["id", "ward", "bed_number", "status", "patient_id"]
            )
            table_count += 1
        except ImportError as e:
            print(f"\n  [SKIP] Bed model not found: {e}")
            
        # EQUIPMENT TABLE
        try:
            from models.equipment import Equipment
            total_rows += print_table_data(
                Equipment,
                "EQUIPMENT",
                ["id", "name", "category", "status", "department"]
            )
            table_count += 1
        except ImportError as e:
            print(f"\n  [SKIP] Equipment model not found: {e}")
            
        # MEDICINE TABLE
        try:
            from models.medicine import Medicine
            total_rows += print_table_data(
                Medicine,
                "MEDICINES",
                ["id", "name", "category", "stock", "unit_price"]
            )
            table_count += 1
        except ImportError as e:
            print(f"\n  [SKIP] Medicine model not found: {e}")
            
        # FINANCE TABLE
        try:
            from models.finance import FinanceRecord
            total_rows += print_table_data(
                FinanceRecord,
                "FINANCE RECORDS",
                ["id", "record_type", "category", "amount", "department"]
            )
            table_count += 1
        except ImportError as e:
            print(f"\n  [SKIP] FinanceRecord model not found: {e}")
            
        # REPORT TABLE
        try:
            from models.report import Report
            total_rows += print_table_data(
                Report,
                "REPORTS",
                ["id", "patient_id", "doctor_name", "visit_date", "diagnosis"]
            )
            table_count += 1
        except ImportError as e:
            print(f"\n  [SKIP] Report model not found: {e}")

        # USER TABLE
        try:
            from models.user import User
            total_rows += print_table_data(
                User,
                "USERS",
                ["id", "email", "name", "role", "is_active"]
            )
            table_count += 1
        except ImportError as e:
            print(f"\n  [SKIP] User model not found: {e}")
            
        # NOTIFICATION TABLE
        try:
            from models.notification import Notification
            total_rows += print_table_data(
                Notification,
                "NOTIFICATIONS",
                ["id", "user_id", "type", "title", "read"]
            )
            table_count += 1
        except ImportError as e:
            print(f"\n  [SKIP] Notification model not found: {e}")


        # ── Raw SQL fallback — list ALL tables in the database ─────────
        print_separator("ALL TABLES IN DATABASE (raw SQL)")
        try:
            from sqlalchemy import inspect, text
            from extensions import db

            inspector = inspect(db.engine)
            all_tables = inspector.get_table_names()
            
            print(f"  Tables found: {len(all_tables)}")
            for t in all_tables:
                try:
                    result = db.session.execute(text(f"SELECT COUNT(*) FROM [{t}]"))
                    count = result.scalar()
                    print(f"  • {t:<35} {count} rows")
                except:
                    try:
                        result = db.session.execute(text(f'SELECT COUNT(*) FROM "{t}"'))
                        count = result.scalar()
                        print(f"  • {t:<35} {count} rows")
                    except Exception as inner_e:
                        # SQLite might not like brackets or quotes depending on exact context
                        try:
                            result = db.session.execute(text(f'SELECT COUNT(*) FROM {t}'))
                            count = result.scalar()
                            print(f"  • {t:<35} {count} rows")
                        except Exception as deepest:
                            print(f"  • {t:<35} (could not count: {deepest})")
        except Exception as e:
            print(f"  Could not list tables via SQL inspector: {e}")

        # ── Final Summary ──────────────────────────────────────────────
        print_separator("SUMMARY")
        print(f"  Tables read via models : {table_count}")
        print(f"  Total rows seen        : {total_rows}")
        print(f"\n  Database verification complete.")
        print("="*70 + "\n")


if __name__ == "__main__":
    main()
