package com.infinitecareers.modules.tenancy;

import com.infinitecareers.common.BaseTenantEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "departments")
public class Department extends BaseTenantEntity {

    @Column(name = "business_unit_id")
    private String businessUnitId;

    @Column(name = "parent_department_id")
    private String parentDepartmentId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "code", nullable = false)
    private String code;

    public String getBusinessUnitId() { return businessUnitId; }
    public void setBusinessUnitId(String businessUnitId) { this.businessUnitId = businessUnitId; }
    public String getParentDepartmentId() { return parentDepartmentId; }
    public void setParentDepartmentId(String parentDepartmentId) { this.parentDepartmentId = parentDepartmentId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
