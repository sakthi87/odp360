package com.odp.intake;

import com.odp.intake.repository.IntakeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class IntakeApplication implements CommandLineRunner {

    @Autowired(required = false)
    private IntakeRepository intakeRepository;

    public static void main(String[] args) {
        SpringApplication.run(IntakeApplication.class, args);
    }

    @Override
    public void run(String... args) {
        // Initialize database tables on startup (if repository is available)
        if (intakeRepository != null) {
            try {
                intakeRepository.initializeTables();
            } catch (Exception e) {
                System.err.println("Warning: Could not initialize database tables. Database may not be available yet.");
                System.err.println("Error: " + e.getMessage());
            }
        }
    }
}

