package com.runbook.engine;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class RunbookEngineApplication {

	public static void main(String[] args) {
		SpringApplication.run(RunbookEngineApplication.class, args);
	}

}
