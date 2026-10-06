package com.infinitecareers.common.security;

import com.infinitecareers.common.TenantContextHolder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;

@Service
public class PiiSecurityService {

    public String maskAadhaar(String aadhaar) {
        if (aadhaar == null || aadhaar.replaceAll("\\s+", "").length() < 4) {
            return "XXXX-XXXX-XXXX";
        }
        String clean = aadhaar.replaceAll("\\s+", "");
        String last4 = clean.substring(clean.length() - 4);
        return "XXXX-XXXX-" + last4;
    }

    public String maskPan(String pan) {
        if (pan == null || pan.trim().length() < 4) {
            return "XXXXX0000X";
        }
        String clean = pan.trim();
        if (clean.length() >= 10) {
            return "XXXXXX" + clean.substring(clean.length() - 4);
        }
        return "XXXXXX" + clean.substring(Math.max(0, clean.length() - 4));
    }

    public String maskBankAccount(String accountNumber) {
        if (accountNumber == null || accountNumber.trim().length() < 4) {
            return "XXXXXXXX0000";
        }
        String clean = accountNumber.trim();
        return "XXXXXX" + clean.substring(clean.length() - 4);
    }

    public String maskPhone(String phone) {
        if (phone == null || phone.trim().length() < 4) {
            return "+91 XXXXX X0000";
        }
        String clean = phone.trim();
        return "+91 XXXXX X" + clean.substring(clean.length() - 4);
    }

    public String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "x***@domain.com";
        }
        String[] parts = email.split("@");
        String name = parts[0];
        String domain = parts[1];
        if (name.length() <= 2) {
            return name.charAt(0) + "***@" + domain;
        }
        return name.charAt(0) + "***" + name.charAt(name.length() - 1) + "@" + domain;
    }

    public boolean canViewSensitiveData(String permissionRequired) {
        if (TenantContextHolder.getContext() == null) return false;
        Set<String> roles = TenantContextHolder.getContext().getRoles();
        if (roles.contains("SUPER_ADMIN") || roles.contains("HR_OPS")) {
            return true;
        }
        Set<String> perms = TenantContextHolder.getContext().getPermissions();
        return perms.contains(permissionRequired);
    }

    /**
     * Sanitizes map before dispatching to external LLM / Search / Loggers
     */
    public Map<String, Object> sanitizeForAiOrSearch(Map<String, Object> payload) {
        if (payload == null) return Map.of();
        Map<String, Object> sanitized = new java.util.HashMap<>(payload);

        // Strip or mask highly sensitive fields
        sanitized.remove("aadhaar");
        sanitized.remove("aadhaarNumber");
        sanitized.remove("pan");
        sanitized.remove("panNumber");
        sanitized.remove("bankAccount");
        sanitized.remove("bankAccountNumber");
        sanitized.remove("bankIfsc");
        sanitized.remove("uan");
        sanitized.remove("passwordHash");
        sanitized.remove("mfaSecret");

        if (sanitized.containsKey("email")) {
            sanitized.put("email", maskEmail((String) sanitized.get("email")));
        }
        if (sanitized.containsKey("phone")) {
            sanitized.put("phone", maskPhone((String) sanitized.get("phone")));
        }

        return sanitized;
    }
}
