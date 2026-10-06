import { pgTable, uuid, text, timestamp, integer, boolean, date, numeric, index, unique, uniqueIndex, foreignKey, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const id = () => uuid("id").primaryKey().defaultRandom();
const created = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updated = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const adminUsers = pgTable("admin_users", {
  id: id(), email: text("email").notNull().unique(), passwordHash: text("password_hash").notNull(), createdAt: created()
});
export const accessCodes = pgTable("access_codes", {
  id: id(), code: text("code").notNull().unique(), customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"), status: text("status", { enum: ["active", "blocked"] }).notNull().default("active"),
  plan: text("plan", { enum: ["individual", "pro"] }).notNull().default("individual"), studentLimit: integer("student_limit").notNull().default(10),
  createdAt: created(), updatedAt: updated(), lastAccessAt: timestamp("last_access_at", { withTimezone: true })
}, t => [check("access_limit_positive", sql`${t.studentLimit} > 0`)]);
export const sessions = pgTable("sessions", {
  id: id(), tokenHash: text("token_hash").notNull().unique(), accessCodeId: uuid("access_code_id").references(() => accessCodes.id, { onDelete: "cascade" }),
  adminId: uuid("admin_id").references(() => adminUsers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), createdAt: created()
}, t => [index("sessions_expiry_idx").on(t.expiresAt), check("session_one_owner", sql`(${t.accessCodeId} IS NULL) <> (${t.adminId} IS NULL)`)]);
export const loginAttempts = pgTable("login_attempts", {
  key: text("key").primaryKey(), attempts: integer("attempts").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
  blockedUntil: timestamp("blocked_until", { withTimezone: true }).notNull().defaultNow()
});
export const teacherProfiles = pgTable("teacher_profiles", {
  id: id(), accessCodeId: uuid("access_code_id").notNull().unique().references(() => accessCodes.id, { onDelete: "cascade" }),
  name: text("name").notNull(), professionalName: text("professional_name").notNull().default(""), email: text("email"), phone: text("phone").notNull().default(""),
  mainSubject: text("main_subject").notNull().default(""), additionalSubjects: text("additional_subjects").notNull().default(""),
  photoUrl: text("photo_url"), logoUrl: text("logo_url"), onboardingCompleted: boolean("onboarding_completed").notNull().default(false), createdAt: created()
});
export const students = pgTable("students", {
  id: id(), accessCodeId: uuid("access_code_id").notNull().references(() => accessCodes.id, { onDelete: "cascade" }),
  name: text("name").notNull(), birthDate: date("birth_date"), age: integer("age"), grade: text("grade").notNull(), school: text("school"), subject: text("subject").notNull(),
  startDate: date("start_date").notNull(), frequency: text("frequency").notNull().default(""), responsibleName: text("responsible_name").notNull().default(""),
  responsiblePhone: text("responsible_phone").notNull().default(""), responsibleEmail: text("responsible_email"),
  mainGoal: text("main_goal").notNull().default(""), difficulties: text("difficulties").notNull().default(""), strengths: text("strengths").notNull().default(""), notes: text("notes").notNull().default(""),
  active: boolean("active").notNull().default(true), archivedAt: timestamp("archived_at", { withTimezone: true }), createdAt: created(), updatedAt: updated()
}, t => [unique("students_owner_id_unique").on(t.accessCodeId, t.id), index("students_owner_active_idx").on(t.accessCodeId, t.active), check("student_age_valid", sql`${t.age} IS NULL OR ${t.age} BETWEEN 1 AND 120`)]);

const owner = () => uuid("access_code_id").notNull().references(() => accessCodes.id, { onDelete: "cascade" });
const student = () => uuid("student_id").notNull();
export const lessonPackages = pgTable("lesson_packages", {
  id: id(), accessCodeId: owner(), studentId: student(), totalLessons: integer("total_lessons").notNull(), usedLessons: integer("used_lessons").notNull().default(0),
  value: numeric("value", { precision: 12, scale: 2 }).notNull(), startDate: date("start_date").notNull(), renewalDate: date("renewal_date"),
  status: text("status", { enum: ["current", "closed"] }).notNull().default("current"), createdAt: created()
}, t => [foreignKey({ columns: [t.accessCodeId, t.studentId], foreignColumns: [students.accessCodeId, students.id] }).onDelete("cascade"),
  uniqueIndex("package_one_current").on(t.studentId).where(sql`${t.status} = 'current'`), unique("package_owner_id_unique").on(t.accessCodeId,t.studentId,t.id),
  check("package_counts_valid", sql`${t.totalLessons} > 0 AND ${t.usedLessons} >= 0 AND ${t.usedLessons} <= ${t.totalLessons}`), check("package_value_valid", sql`${t.value} >= 0`)]);
export const lessons = pgTable("lessons", {
  id: id(), accessCodeId: owner(), studentId: student(), packageId: uuid("package_id"), date: date("date").notNull(), startTime: text("start_time").notNull(), duration: integer("duration").notNull(),
  status: text("status", { enum: ["scheduled", "completed", "absent", "cancelled", "makeup"] }).notNull(), justifiedAbsence: boolean("justified_absence").notNull().default(false),
  content: text("content").notNull().default(""), publicSummary: text("public_summary").notNull().default(""), activities: text("activities").notNull().default(""), lessonRating: text("lesson_rating").notNull().default("Boa"),
  participation: text("participation").notNull().default("Boa"), achievement: text("achievement").notNull().default(""), difficulty: text("difficulty").notNull().default(""),
  homework: text("homework").notNull().default(""), nextFocus: text("next_focus").notNull().default(""), createdAt: created(), updatedAt: updated()
}, t => [foreignKey({columns:[t.accessCodeId,t.studentId],foreignColumns:[students.accessCodeId,students.id]}).onDelete("cascade"),
  foreignKey({columns:[t.accessCodeId,t.studentId,t.packageId],foreignColumns:[lessonPackages.accessCodeId,lessonPackages.studentId,lessonPackages.id]}),
  index("lessons_owner_date_idx").on(t.accessCodeId,t.date), index("lessons_student_date_idx").on(t.studentId,t.date), check("lesson_duration_valid",sql`${t.duration} BETWEEN 5 AND 480`)]);
export const progressEntries = pgTable("progress_entries", {
  id:id(), accessCodeId:owner(), studentId:student(), date:date("date").notNull(), comprehension:integer("comprehension").notNull(), autonomy:integer("autonomy").notNull(),
  participation:integer("participation").notNull(), organization:integer("organization").notNull(), concentration:integer("concentration").notNull(), activityCompletion:integer("activity_completion").notNull(),
  mainImprovement:text("main_improvement").notNull().default(""), attentionPoint:text("attention_point").notNull().default(""), createdAt:created()
},t=>[foreignKey({columns:[t.accessCodeId,t.studentId],foreignColumns:[students.accessCodeId,students.id]}).onDelete("cascade"),index("progress_owner_student_date_idx").on(t.accessCodeId,t.studentId,t.date),
  check("progress_scores_valid",sql`${t.comprehension} BETWEEN 1 AND 5 AND ${t.autonomy} BETWEEN 1 AND 5 AND ${t.participation} BETWEEN 1 AND 5 AND ${t.organization} BETWEEN 1 AND 5 AND ${t.concentration} BETWEEN 1 AND 5 AND ${t.activityCompletion} BETWEEN 1 AND 5`)]);
export const studentGoals = pgTable("student_goals", {
  id:id(),accessCodeId:owner(),studentId:student(),title:text("title").notNull(),description:text("description").notNull().default(""),targetDate:date("target_date"),
  progress:integer("progress").notNull().default(1),status:text("status",{enum:["ongoing","achieved","paused"]}).notNull().default("ongoing"),createdAt:created()
},t=>[foreignKey({columns:[t.accessCodeId,t.studentId],foreignColumns:[students.accessCodeId,students.id]}).onDelete("cascade"),index("goals_owner_student_idx").on(t.accessCodeId,t.studentId),check("goal_progress_valid",sql`${t.progress} BETWEEN 1 AND 5`)]);
export const payments = pgTable("payments", {
  id:id(),accessCodeId:owner(),studentId:student(),description:text("description").notNull(),amount:numeric("amount",{precision:12,scale:2}).notNull(),dueDate:date("due_date").notNull(),
  paidAt:date("paid_at"),paymentMethod:text("payment_method").notNull().default(""),status:text("status",{enum:["paid","pending","overdue"]}).notNull().default("pending"),createdAt:created()
},t=>[foreignKey({columns:[t.accessCodeId,t.studentId],foreignColumns:[students.accessCodeId,students.id]}).onDelete("cascade"),index("payments_owner_status_date_idx").on(t.accessCodeId,t.status,t.dueDate),
  check("payment_amount_valid",sql`${t.amount} > 0`),check("payment_date_valid",sql`(${t.status} = 'paid' AND ${t.paidAt} IS NOT NULL) OR (${t.status} <> 'paid' AND ${t.paidAt} IS NULL)`)]);
export const reports = pgTable("reports", {
  id:id(),accessCodeId:owner(),studentId:student(),periodStart:date("period_start").notNull(),periodEnd:date("period_end").notNull(),lessonsCount:integer("lessons_count").notNull(),
  contents:text("contents").notNull(),improvements:text("improvements").notNull(),attentionPoints:text("attention_points").notNull(),
  participationRating:text("participation_rating").notNull(),activitiesRating:text("activities_rating").notNull(),generalProgress:text("general_progress").notNull(),
  nextGoals:text("next_goals").notNull(),teacherMessage:text("teacher_message").notNull(),snapshot: text("snapshot").notNull().default("{}"),generatedAt:timestamp("generated_at",{withTimezone:true}).notNull().defaultNow()
},t=>[foreignKey({columns:[t.accessCodeId,t.studentId],foreignColumns:[students.accessCodeId,students.id]}).onDelete("cascade"),index("reports_owner_student_period_idx").on(t.accessCodeId,t.studentId,t.periodStart),
  check("report_period_valid",sql`${t.periodEnd} >= ${t.periodStart} AND ${t.lessonsCount} >= 0`)]);
export const activityLogs = pgTable("activity_logs", {
  id:id(),accessCodeId:owner(),message:text("message").notNull(),createdAt:created()
},t=>[index("activity_owner_date_idx").on(t.accessCodeId,t.createdAt)]);

export const responsibleContacts = pgTable("responsible_contacts", {
  id:id(),accessCodeId:owner(),name:text("name").notNull(),phone:text("phone").notNull().default(""),email:text("email"),createdAt:created(),updatedAt:updated()
},t=>[index("responsible_contacts_owner_idx").on(t.accessCodeId)]);
export const responsibleStudentAccess = pgTable("responsible_student_access", {
  id:id(),accessCodeId:owner(),responsibleId:uuid("responsible_id").notNull().references(()=>responsibleContacts.id,{onDelete:"cascade"}),studentId:student(),
  code:text("code").notNull().unique(),status:text("status",{enum:["active","blocked","revoked"]}).notNull().default("active"),
  createdAt:created(),updatedAt:updated(),lastAccessAt:timestamp("last_access_at",{withTimezone:true})
},t=>[foreignKey({columns:[t.accessCodeId,t.studentId],foreignColumns:[students.accessCodeId,students.id]}).onDelete("cascade"),
  index("responsible_access_student_idx").on(t.accessCodeId,t.studentId),index("responsible_access_responsible_idx").on(t.responsibleId)]);
export const responsibleSessions = pgTable("responsible_sessions", {
  id:id(),tokenHash:text("token_hash").notNull().unique(),
  responsibleAccessId:uuid("responsible_access_id").notNull().references(()=>responsibleStudentAccess.id,{onDelete:"cascade"}),
  expiresAt:timestamp("expires_at",{withTimezone:true}).notNull(),createdAt:created()
},t=>[index("responsible_sessions_expiry_idx").on(t.expiresAt)]);
export const portalSettings = pgTable("portal_settings", {
  id:id(),accessCodeId:uuid("access_code_id").notNull().unique().references(()=>accessCodes.id,{onDelete:"cascade"}),
  enabled:boolean("enabled").notNull().default(true),showFinance:boolean("show_finance").notNull().default(true),
  showProgress:boolean("show_progress").notNull().default(true),showLessonContent:boolean("show_lesson_content").notNull().default(true),
  showReports:boolean("show_reports").notNull().default(true),rulesPayment:text("rules_payment").notNull().default(""),
  rulesCancellation:text("rules_cancellation").notNull().default(""),rulesReplacement:text("rules_replacement").notNull().default(""),
  schedules:text("schedules").notNull().default(""),materials:text("materials").notNull().default(""),otherInfo:text("other_info").notNull().default(""),
  createdAt:created(),updatedAt:updated()
});
export const makeupSlots = pgTable("makeup_slots", {
  id:id(),accessCodeId:owner(),date:date("date").notNull(),startTime:text("start_time").notNull(),endTime:text("end_time").notNull(),
  status:text("status",{enum:["available","requested","confirmed","unavailable"]}).notNull().default("available"),createdAt:created()
},t=>[index("makeup_slots_owner_date_idx").on(t.accessCodeId,t.date),check("makeup_slot_times_valid",sql`${t.startTime} < ${t.endTime}`)]);
export const makeupRequests = pgTable("makeup_requests", {
  id:id(),accessCodeId:owner(),slotId:uuid("slot_id").notNull().references(()=>makeupSlots.id,{onDelete:"cascade"}),studentId:student(),
  responsibleAccessId:uuid("responsible_access_id").notNull().references(()=>responsibleStudentAccess.id,{onDelete:"cascade"}),
  status:text("status",{enum:["pending","approved","rejected","cancelled"]}).notNull().default("pending"),createdAt:created(),updatedAt:updated()
},t=>[foreignKey({columns:[t.accessCodeId,t.studentId],foreignColumns:[students.accessCodeId,students.id]}).onDelete("cascade"),
  index("makeup_requests_owner_status_idx").on(t.accessCodeId,t.status),
  uniqueIndex("makeup_slot_one_pending").on(t.slotId).where(sql`${t.status} = 'pending'`)]);
