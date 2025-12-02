package com.odp.intake.model.response;

public class IntakeResponse {
    private String intakeId;
    private String status;
    private String message;
    private String generatedCQL;
    private String keyspace;
    private String tableName;

    public IntakeResponse() {
    }

    public IntakeResponse(String intakeId, String status) {
        this.intakeId = intakeId;
        this.status = status;
    }

    public String getIntakeId() {
        return intakeId;
    }

    public void setIntakeId(String intakeId) {
        this.intakeId = intakeId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getGeneratedCQL() {
        return generatedCQL;
    }

    public void setGeneratedCQL(String generatedCQL) {
        this.generatedCQL = generatedCQL;
    }

    public String getKeyspace() {
        return keyspace;
    }

    public void setKeyspace(String keyspace) {
        this.keyspace = keyspace;
    }

    public String getTableName() {
        return tableName;
    }

    public void setTableName(String tableName) {
        this.tableName = tableName;
    }
}

