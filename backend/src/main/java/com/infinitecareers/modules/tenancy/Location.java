package com.infinitecareers.modules.tenancy;

import com.infinitecareers.common.BaseTenantEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "locations")
public class Location extends BaseTenantEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "city", nullable = false)
    private String city;

    @Column(name = "state_province")
    private String stateProvince;

    @Column(name = "country", nullable = false)
    private String country;

    @Column(name = "is_remote")
    private Boolean isRemote = false;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getStateProvince() { return stateProvince; }
    public void setStateProvince(String stateProvince) { this.stateProvince = stateProvince; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public Boolean getIsRemote() { return isRemote; }
    public void setIsRemote(Boolean remote) { isRemote = remote; }
}
