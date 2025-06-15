import dotenv from 'dotenv';
dotenv.config();

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createType('role_user', ['ADMIN', 'EMPLOYEE']);
  pgm.createTable('users', {
    user_id: {
      type: 'varchar(300)',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    fullname: {
      type: 'varchar(300)',
    },
    username: {
      type: 'varchar(100)',
    },
    password: {
      type: 'varchar(500)',
    },
    create_at: {
      type: 'timestamptz',
      default: pgm.func('NOW()'),
    },
    create_by: {
      type: 'varchar(300)',
      default: "'adm'",
    },
    update_at: {
      type: 'timestamptz',
    },
    update_by: {
      type: 'varchar(300)',
    },
    role: {
      type: 'role_user',
    },
    hourly_salary: {
      type: 'numeric',
    },
    ip: {
      type: 'varchar(100)',
    },
  });

  pgm.createTable('attendance_emp', {
    uid: {
      type: 'varchar(225)',
      default: pgm.func('gen_random_uuid()'),
      primaryKey: true,
    },
    payroll_id: {
      type: 'varchar(225)',
    },
    clockin: {
      type: 'timestamptz',
    },
    clockout: {
      type: 'timestamptz',
    },
    user_id: {
      type: 'varchar(300)',
    },
    ip: {
      type: 'varchar(100)',
    },
  });

  pgm.createTable('overtime_log_emp', {
    uid: {
      type: 'varchar(255)',
      default: pgm.func('gen_random_uuid()'),
      primaryKey: true,
    },
    payroll_id: {
      type: 'varchar(255)',
    },
    attendance_id: {
      type: 'varchar(255)',
    },
    user_id: {
      type: 'varchar(300)',
    },
    hour_length: {
      type: 'numeric',
    },
    hours_actual: {
      type: 'numeric',
    },
    clockout_propose: {
      type: 'timestamptz',
    },
    clockout: {
      type: 'timestamptz',
    },
    create_at: {
      type: 'timestamptz',
      default: pgm.func('NOW()'),
    },
    create_by: {
      type: 'varchar(300)',
    },
    update_at: {
      type: 'timestamptz',
    },
    update_by: {
      type: 'varchar(300)',
    },
    ip: {
      type: 'varchar(100)',
    },
  });

  pgm.createTable('payroll_res', {
    uid: {
      type: 'varchar(255)',
      default: pgm.func('gen_random_uuid()'),
      primaryKey: true,
    },
    user_id: {
      type: 'varchar(300)',
    },
    payroll_period_id: {
      type: 'varchar(255)',
    },
    attendance_hours: {
      type: 'numeric',
    },
    overtime_hours: {
      type: 'numeric',
    },
    attendance_wage: {
      type: 'numeric',
    },
    overtime_wage: {
      type: 'numeric',
    },
    reimburse_wage: {
      type: 'numeric',
    },
    total_wage: {
      type: 'numeric',
    },
    create_at: {
      type: 'timestamptz',
      default: pgm.func('NOW()'),
    },
    create_by: {
      type: 'varchar(300)',
    },
    update_at: {
      type: 'timestamptz',
    },
    update_by: {
      type: 'varchar(300)',
    },
    ip: {
      type: 'varchar(100)',
    },
  });

  pgm.createTable('payroll_period', {
    uid: {
      type: 'varchar(255)',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    month: {
      type: 'numeric',
    },
    year: {
      type: 'numeric',
    },
    start_period: {
      type: 'timestamptz',
    },
    end_period: {
      type: 'timestamptz',
    },
    code: {
      type: 'varchar(100)',
    },
    create_at: {
      type: 'timestamptz',
    },
    create_by: {
      type: 'varchar(300)',
    },
    update_at: {
      type: 'timestamptz',
    },
    update_by: {
      type: 'varchar(300)',
    },
    status: {
      type: 'smallint',
    },
    ip: {
      type: 'varchar(100)',
    },
  });

  pgm.createTable('reimbursment_emp', {
    uid: {
      type: 'varchar(255)',
      default: pgm.func('gen_random_uuid()'),
      primaryKey: true,
    },
    payroll_id: {
      type: 'varchar(255)',
    },
    user_id: {
      type: 'varchar(300)',
    },
    date_reimb: {
      type: 'date',
    },
    amount_reimb: {
      type: 'numeric',
    },
    reimb_desc: {
      type: 'varchar(500)',
    },
    create_at: {
      type: 'timestamptz',
      default: pgm.func('NOW()'),
    },
    create_by: {
      type: 'varchar(300)',
    },
    update_at: {
      type: 'timestamptz',
    },
    update_by: {
      type: 'varchar(300)',
    },
    status: {
      type: 'int2',
    },
    ip: {
      type: 'varchar(100)',
    },
  });

  pgm.addConstraint('reimbursment_emp', 'fk_reimb_user', {
    foreignKeys: {
      columns: 'user_id',
      references: 'users',
    },
  });

  pgm.addConstraint('reimbursment_emp', 'fk_reimb_payroll', {
    foreignKeys: {
      columns: 'payroll_id',
      references: 'payroll_period',
    },
  });

  pgm.addConstraint('attendance_emp', 'fk_attend_user', {
    foreignKeys: {
      columns: 'user_id',
      references: 'users',
    },
  });
  pgm.addConstraint('attendance_emp', 'fk_attend_payroll', {
    foreignKeys: {
      columns: 'payroll_id',
      references: 'payroll_period',
    },
  });

  pgm.addConstraint('overtime_log_emp', 'fk_ovt_user', {
    foreignKeys: {
      columns: 'user_id',
      references: 'users',
    },
  });

  pgm.addConstraint('overtime_log_emp', 'fk_ovt_payroll', {
    foreignKeys: {
      columns: 'payroll_id',
      references: 'payroll_period',
    },
  });
  pgm.addConstraint('overtime_log_emp', 'fk_ovt_att', {
    foreignKeys: {
      columns: 'attendance_id',
      references: 'attendance_emp',
    },
  });
  pgm.addConstraint('payroll_res', 'fk_prllres_user', {
    foreignKeys: {
      columns: 'user_id',
      references: 'users',
    },
  });
  pgm.addConstraint('payroll_res', 'fk_prllres_prd', {
    foreignKeys: {
      columns: 'payroll_period_id',
      references: 'payroll_period',
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropSchema('public', {
    cascade: true,
  });
};
