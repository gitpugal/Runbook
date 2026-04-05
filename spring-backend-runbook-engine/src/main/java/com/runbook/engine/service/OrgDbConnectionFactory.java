package com.runbook.engine.service;

import com.runbook.engine.domain.OrgDatabase;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Base64;

@Component
public class OrgDbConnectionFactory {

    public Connection connect(OrgDatabase db) throws SQLException {
        String url = switch (db.getType().toString().toLowerCase()) {
            case "postgres" -> "jdbc:postgresql://" + db.getHost() + ":" + db.getPort() + "/" + db.getDatabaseName();
            case "mysql" -> "jdbc:mysql://" + db.getHost() + ":" + db.getPort() + "/" + db.getDatabaseName();
            default -> throw new RuntimeException("Unsupported DB type");
        };

        return DriverManager.getConnection(url, db.getUsername(), decrypt(db.getEncryptedPassword()));
    }

    public String decrypt(String encoded) {
        byte[] decodedBytes = Base64.getDecoder().decode(encoded);
        return new String(decodedBytes);
    }
}
