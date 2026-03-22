const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

// Use DATABASE_URL from process.env or fallback to local
const dbUrl = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/opportunityhub';

let pool;

try {
    pool = mysql.createPool(dbUrl);
    console.log('✔ MySQL Connection Pool Created');
} catch (err) {
    console.error('✘ Failed to create MySQL pool:', err.message);
}

// Compatibility Wrapper for SQLite-like API
const db = {
    all: async (query, params = []) => {
        try {
            const [rows] = await pool.execute(query.replace(/\?/g, '?'), params);
            return rows;
        } catch (err) {
            console.error('[DB Error] all:', err.message);
            throw err;
        }
    },
    get: async (query, params = []) => {
        try {
            const [rows] = await pool.execute(query.replace(/\?/g, '?'), params);
            return rows[0] || null;
        } catch (err) {
            console.error('[DB Error] get:', err.message);
            throw err;
        }
    },
    run: async (query, params = []) => {
        try {
            const [result] = await pool.execute(query.replace(/\?/g, '?'), params);
            return { lastID: result.insertId, changes: result.affectedRows };
        } catch (err) {
            console.error('[DB Error] run:', err.message);
            throw err;
        }
    },
    // Special case for migrations or complex transactions if needed
    serialize: (fn) => fn(), 
    execute: (query, params = []) => pool.execute(query, params)
};

const initDB = async () => {
    console.log('Initializing MySQL Database Schema...');
    try {
        // Users table
        await db.execute(`CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255) UNIQUE,
            name VARCHAR(255),
            password VARCHAR(255),
            plan_id VARCHAR(50) DEFAULT 'free',
            google_drive_token TEXT,
            google_drive_refresh_token TEXT,
            bio TEXT,
            skills TEXT,
            avatar_url VARCHAR(255),
            last_sync_at DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Migration: Add last_sync_at if it's missing (for existing MySQL databases)
        // We explicitly check for existence to avoid unnecessary errors in logs
        try {
            const columns = await db.all(`SHOW COLUMNS FROM users LIKE 'last_sync_at'`);
            if (columns.length === 0) {
                await db.execute(`ALTER TABLE users ADD COLUMN last_sync_at DATETIME NULL AFTER avatar_url`);
                console.log('✔ Migrated: Added last_sync_at to users table');
            }
        } catch (err) {
            console.warn('⚠ Migration Check Warning:', err.message);
        }

        // Opportunities
        await db.execute(`CREATE TABLE IF NOT EXISTS opportunities (
            id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255),
            title VARCHAR(255),
            organization VARCHAR(255),
            deadline VARCHAR(100),
            source VARCHAR(50),
            url VARCHAR(500),
            category VARCHAR(50),
            description LONGTEXT,
            prize VARCHAR(255),
            location VARCHAR(255),
            status VARCHAR(20) DEFAULT 'pending',
            quality_score INTEGER DEFAULT 0,
            collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX (user_id)
        )`);

        // Teams & Community
        await db.execute(`CREATE TABLE IF NOT EXISTS teams (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255),
            owner_id VARCHAR(255),
            description TEXT,
            is_private BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS team_members (
            team_id VARCHAR(255),
            user_id VARCHAR(255),
            role VARCHAR(50) DEFAULT 'member',
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(team_id, user_id)
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS messages (
            id VARCHAR(255) PRIMARY KEY,
            team_id VARCHAR(255),
            user_id VARCHAR(255),
            content LONGTEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX (team_id)
        )`);

        // Meetings
        await db.execute(`CREATE TABLE IF NOT EXISTS meetings (
            id VARCHAR(255) PRIMARY KEY,
            team_id VARCHAR(255),
            title VARCHAR(255),
            startTime DATETIME,
            link VARCHAR(500),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Schedules
        await db.execute(`CREATE TABLE IF NOT EXISTS schedules (
            id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255),
            frequency VARCHAR(50),
            time VARCHAR(20),
            enabled BOOLEAN DEFAULT 1,
            last_run DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Feedback & Clicks
        await db.execute(`CREATE TABLE IF NOT EXISTS user_feedback (
            id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255),
            opportunity_id VARCHAR(255),
            feedback_type VARCHAR(50), 
            score FLOAT,
            rank INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX (user_id),
            INDEX (opportunity_id)
        )`);

        console.log('✔ MySQL Database Schema Initialized');
    } catch (err) {
        console.error('✘ Schema Initialization Failed:', err.message);
        throw err;
    }
};

module.exports = { db, initDB };
