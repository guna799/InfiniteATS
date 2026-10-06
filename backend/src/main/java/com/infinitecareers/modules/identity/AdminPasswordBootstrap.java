package com.infinitecareers.modules.identity;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Sets existing staff users' password at startup when APP_BOOTSTRAP_ADMIN_EMAIL (comma-separated) and
 * APP_BOOTSTRAP_ADMIN_PASSWORD are both provided (seeded users ship without a usable password).
 * Never creates users; remove the variables once the password has been set.
 */
@Component
public class AdminPasswordBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminPasswordBootstrap.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;

    public AdminPasswordBootstrap(UserRepository userRepository, PasswordEncoder passwordEncoder,
                                  @Value("${app.bootstrap.admin-email:}") String email,
                                  @Value("${app.bootstrap.admin-password:}") String password) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
        this.password = password;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (email.isBlank() || password.isBlank()) {
            return;
        }
        if (password.length() < 12) {
            log.warn("Bootstrap admin password ignored: must be at least 12 characters");
            return;
        }
        for (String address : email.split(",")) {
            String normalized = address.trim().toLowerCase();
            if (normalized.isEmpty()) {
                continue;
            }
            userRepository.findByEmail(normalized).ifPresentOrElse(user -> {
                user.setPasswordHash(passwordEncoder.encode(password));
                userRepository.save(user);
                log.info("Bootstrap password set for {}", user.getEmail());
            }, () -> log.warn("Bootstrap admin {} not found; no password set", normalized));
        }
    }
}
