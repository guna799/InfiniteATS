package com.infinitecareers.modules.employees;

import com.infinitecareers.common.BaseTenantEntity;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "employees")
public class Employee extends BaseTenantEntity {

    @Column(name = "user_id")
    private String userId;

    @Column(name = "candidate_id")
    private String candidateId;

    @Column(name = "employee_number", nullable = false)
    private String employeeNumber;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "work_email", nullable = false)
    private String workEmail;

    @Column(name = "personal_email")
    private String personalEmail;

    @Column(name = "phone")
    private String phone;

    @Column(name = "job_title", nullable = false)
    private String jobTitle;

    @Column(name = "department_id")
    private String departmentId;

    @Column(name = "location_id")
    private String locationId;

    @Column(name = "manager_id")
    private String managerId;

    @Column(name = "employment_type")
    private String employmentType = "FULL_TIME";

    @Column(name = "hire_date", nullable = false)
    private LocalDate hireDate;

    @Column(name = "status")
    private String status = "ACTIVE";

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getCandidateId() { return candidateId; }
    public void setCandidateId(String candidateId) { this.candidateId = candidateId; }
    public String getEmployeeNumber() { return employeeNumber; }
    public void setEmployeeNumber(String employeeNumber) { this.employeeNumber = employeeNumber; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getWorkEmail() { return workEmail; }
    public void setWorkEmail(String workEmail) { this.workEmail = workEmail; }
    public String getPersonalEmail() { return personalEmail; }
    public void setPersonalEmail(String personalEmail) { this.personalEmail = personalEmail; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }
    public String getLocationId() { return locationId; }
    public void setLocationId(String locationId) { this.locationId = locationId; }
    public String getManagerId() { return managerId; }
    public void setManagerId(String managerId) { this.managerId = managerId; }
    public String getEmploymentType() { return employmentType; }
    public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }
    public LocalDate getHireDate() { return hireDate; }
    public void setHireDate(LocalDate hireDate) { this.hireDate = hireDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
