export type PayslipDetail = {
  clockin: string;
  clockout: string;
  clockout_overtime: string | null;
  hours_per_day: number;
  overtime_hours: number;
  wage: number;
  overtime_wage: number;
};

export type ReimburseDetail = {
  reimb_date: string;
  reimb_amount: number;
};

export type RawPayslipData = {
  uid: string;
  month: string;
  year: string;
  user_id: string;
  clockin: string;
  clockout: string;
  clockout_overtime: string;
  hours_actual: string;
  hourly_salary: string;
};
