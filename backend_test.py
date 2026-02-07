#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class AccountabilityOSAPITester:
    def __init__(self, base_url="https://abc358e0-49d9-4de8-b422-58fbf6921956.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append({"test": name, "details": details})

    def run_test(self, name, method, endpoint, expected_status=200, data=None, timeout=10):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}")
                return False, {}

        except requests.exceptions.Timeout:
            self.log_test(name, False, "Request timeout")
            return False, {}
        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_health_endpoint(self):
        """Test /api/health endpoint"""
        success, response = self.run_test(
            "Health Check", 
            "GET", 
            "api/health", 
            200
        )
        if success and isinstance(response, dict):
            if response.get("status") == "ok" and "AccountabilityOS" in response.get("service", ""):
                return True
        return False

    def test_users_endpoint(self):
        """Test /api/users endpoint returns seeded data"""
        success, response = self.run_test(
            "Get Users", 
            "GET", 
            "api/users", 
            200
        )
        if success and isinstance(response, list) and len(response) >= 8:
            # Check if we have the expected roles
            roles = [user.get("role") for user in response]
            expected_roles = ["employee", "team_lead", "am", "manager", "hr_head"]
            if all(role in roles for role in expected_roles):
                return True
        return False

    def test_dashboard_endpoints(self):
        """Test dashboard endpoints for different roles"""
        roles = ["team_lead", "employee", "manager", "hr_head"]
        results = []
        
        for role in roles:
            success, response = self.run_test(
                f"Dashboard - {role.replace('_', ' ').title()}", 
                "GET", 
                f"api/dashboard/{role}", 
                200
            )
            
            if success and isinstance(response, dict):
                # Validate specific dashboard data based on role
                if role == "team_lead" and "team_members" in response and "upcoming_meetings" in response:
                    results.append(True)
                elif role == "employee" and "insights" in response:
                    results.append(True) 
                elif role == "manager" and "all_users" in response and "frameworks" in response:
                    results.append(True)
                elif role == "hr_head" and "org_health" in response:
                    results.append(True)
                else:
                    results.append(False)
            else:
                results.append(False)
                
        return all(results)

    def test_one_on_one_sessions(self):
        """Test one-on-one session endpoints"""
        # Test GET sessions
        success, sessions = self.run_test(
            "Get 1-on-1 Sessions", 
            "GET", 
            "api/one-on-one/sessions", 
            200
        )
        
        if not (success and isinstance(sessions, list) and len(sessions) >= 3):
            return False
            
        # Test POST create session
        session_data = {
            "employee_id": "emp-test",
            "employee_name": "Test Employee",
            "date": "2026-01-20T10:00:00Z",
            "meeting_location": "office"
        }
        
        success, new_session = self.run_test(
            "Create 1-on-1 Session", 
            "POST", 
            "api/one-on-one/sessions", 
            200,
            session_data
        )
        
        return success and isinstance(new_session, dict) and "session_id" in new_session

    def test_coaching_goals(self):
        """Test coaching goals endpoints"""
        # Test GET goals
        success, goals = self.run_test(
            "Get Coaching Goals", 
            "GET", 
            "api/coaching/goals", 
            200
        )
        
        if not (success and isinstance(goals, list) and len(goals) >= 2):
            return False
            
        # Test POST create goal
        goal_data = {
            "title": "Test Goal",
            "description": "This is a test coaching goal",
            "source": "custom",
            "start_date": "2026-01-15",
            "target_end_date": "2026-03-15"
        }
        
        success, new_goal = self.run_test(
            "Create Coaching Goal", 
            "POST", 
            "api/coaching/goals", 
            200,
            goal_data
        )
        
        return success and isinstance(new_goal, dict) and "goal_id" in new_goal

    def test_nets_arena(self):
        """Test Nets Practice Arena endpoints"""
        # Test start nets session
        nets_data = {
            "scenario": "Handling difficult team member feedback",
            "persona": "Team Lead",
            "difficulty": "neutral"
        }
        
        success, session = self.run_test(
            "Start Nets Session", 
            "POST", 
            "api/nets/start", 
            200,
            nets_data
        )
        
        return success and isinstance(session, dict) and "session_id" in session

    def test_kpi_frameworks(self):
        """Test KPI framework endpoints"""
        # Test POST create framework
        framework_data = {
            "methodology": "okr",
            "review_frequency": "quarterly",
            "tracking_level": "team",
            "review_groups": ["Engineering", "Design"]
        }
        
        success, framework = self.run_test(
            "Create KPI Framework", 
            "POST", 
            "api/kpi/frameworks", 
            200,
            framework_data
        )
        
        return success and isinstance(framework, dict) and "framework_id" in framework

    def test_nominations(self):
        """Test nominations endpoint"""
        nomination_data = {
            "nominee_name": "Test Nominee",
            "nominee_id": "emp-nominee",
            "target_role": "Senior Developer",
            "program_type": "interviewer"
        }
        
        success, nomination = self.run_test(
            "Create Nomination", 
            "POST", 
            "api/nominations", 
            200,
            nomination_data
        )
        
        return success and isinstance(nomination, dict) and "nomination_id" in nomination

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting AccountabilityOS Backend API Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("-" * 60)

        # Core tests mentioned in requirements
        test_results = {
            "health": self.test_health_endpoint(),
            "users": self.test_users_endpoint(),
            "dashboard": self.test_dashboard_endpoints(),
            "one_on_one": self.test_one_on_one_sessions(),
            "coaching_goals": self.test_coaching_goals(),
            "nets_arena": self.test_nets_arena(),
            "kpi_frameworks": self.test_kpi_frameworks(),
            "nominations": self.test_nominations(),
        }

        print("-" * 60)
        print(f"📊 Tests Summary: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  • {test['test']}: {test['details']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"✨ Success Rate: {success_rate:.1f}%")
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.failed_tests,
            "success_rate": success_rate,
            "test_results": test_results
        }

def main():
    tester = AccountabilityOSAPITester()
    results = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if results["success_rate"] >= 90 else 1

if __name__ == "__main__":
    sys.exit(main())