package com.organiser.platform.config;

import com.icegreen.greenmail.configuration.GreenMailConfiguration;
import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.ServerSetup;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@TestConfiguration
public class TestConfig {
    
    @Bean
    public JavaMailSender javaMailSender() {
        // Configure GreenMail for testing emails
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost("localhost");
        mailSender.setPort(3025); // Default GreenMail SMTP port
        mailSender.setUsername("test@example.com");
        mailSender.setPassword("password");
        
        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.debug", "true");
        
        return mailSender;
    }
    
    @Bean
    public GreenMailExtension greenMail() {
        return new GreenMailExtension(ServerSetup.SMTP)
            .withConfiguration(GreenMailConfiguration.aConfig().withUser("test@example.com", "password"))
            .withPerMethodLifecycle(false);
    }
}
