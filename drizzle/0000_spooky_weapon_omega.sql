CREATE TABLE "access_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text,
	"status" text DEFAULT 'active' NOT NULL,
	"plan" text DEFAULT 'individual' NOT NULL,
	"student_limit" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_access_at" timestamp with time zone,
	CONSTRAINT "access_codes_code_unique" UNIQUE("code"),
	CONSTRAINT "access_limit_positive" CHECK ("access_codes"."student_limit" > 0)
);
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"access_code_id" uuid NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "lesson_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"access_code_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"total_lessons" integer NOT NULL,
	"used_lessons" integer DEFAULT 0 NOT NULL,
	"value" numeric(12, 2) NOT NULL,
	"start_date" date NOT NULL,
	"renewal_date" date,
	"status" text DEFAULT 'current' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "package_owner_id_unique" UNIQUE("access_code_id","student_id","id"),
	CONSTRAINT "package_counts_valid" CHECK ("lesson_packages"."total_lessons" > 0 AND "lesson_packages"."used_lessons" >= 0 AND "lesson_packages"."used_lessons" <= "lesson_packages"."total_lessons"),
	CONSTRAINT "package_value_valid" CHECK ("lesson_packages"."value" >= 0)
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"access_code_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"package_id" uuid,
	"date" date NOT NULL,
	"start_time" text NOT NULL,
	"duration" integer NOT NULL,
	"status" text NOT NULL,
	"justified_absence" boolean DEFAULT false NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"activities" text DEFAULT '' NOT NULL,
	"lesson_rating" text DEFAULT 'Boa' NOT NULL,
	"participation" text DEFAULT 'Boa' NOT NULL,
	"achievement" text DEFAULT '' NOT NULL,
	"difficulty" text DEFAULT '' NOT NULL,
	"homework" text DEFAULT '' NOT NULL,
	"next_focus" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_duration_valid" CHECK ("lessons"."duration" BETWEEN 5 AND 480)
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"key" text PRIMARY KEY NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL,
	"blocked_until" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"access_code_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"due_date" date NOT NULL,
	"paid_at" date,
	"payment_method" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_amount_valid" CHECK ("payments"."amount" > 0),
	CONSTRAINT "payment_date_valid" CHECK (("payments"."status" = 'paid' AND "payments"."paid_at" IS NOT NULL) OR ("payments"."status" <> 'paid' AND "payments"."paid_at" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "progress_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"access_code_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"date" date NOT NULL,
	"comprehension" integer NOT NULL,
	"autonomy" integer NOT NULL,
	"participation" integer NOT NULL,
	"organization" integer NOT NULL,
	"concentration" integer NOT NULL,
	"activity_completion" integer NOT NULL,
	"main_improvement" text DEFAULT '' NOT NULL,
	"attention_point" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "progress_scores_valid" CHECK ("progress_entries"."comprehension" BETWEEN 1 AND 5 AND "progress_entries"."autonomy" BETWEEN 1 AND 5 AND "progress_entries"."participation" BETWEEN 1 AND 5 AND "progress_entries"."organization" BETWEEN 1 AND 5 AND "progress_entries"."concentration" BETWEEN 1 AND 5 AND "progress_entries"."activity_completion" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"access_code_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"lessons_count" integer NOT NULL,
	"contents" text NOT NULL,
	"improvements" text NOT NULL,
	"attention_points" text NOT NULL,
	"participation_rating" text NOT NULL,
	"activities_rating" text NOT NULL,
	"general_progress" text NOT NULL,
	"next_goals" text NOT NULL,
	"teacher_message" text NOT NULL,
	"snapshot" text DEFAULT '{}' NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "report_period_valid" CHECK ("reports"."period_end" >= "reports"."period_start" AND "reports"."lessons_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"access_code_id" uuid,
	"admin_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "session_one_owner" CHECK (("sessions"."access_code_id" IS NULL) <> ("sessions"."admin_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "student_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"access_code_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"target_date" date,
	"progress" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'ongoing' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "goal_progress_valid" CHECK ("student_goals"."progress" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"access_code_id" uuid NOT NULL,
	"name" text NOT NULL,
	"birth_date" date,
	"age" integer,
	"grade" text NOT NULL,
	"school" text,
	"subject" text NOT NULL,
	"start_date" date NOT NULL,
	"frequency" text DEFAULT '' NOT NULL,
	"responsible_name" text DEFAULT '' NOT NULL,
	"responsible_phone" text DEFAULT '' NOT NULL,
	"responsible_email" text,
	"main_goal" text DEFAULT '' NOT NULL,
	"difficulties" text DEFAULT '' NOT NULL,
	"strengths" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "students_owner_id_unique" UNIQUE("access_code_id","id"),
	CONSTRAINT "student_age_valid" CHECK ("students"."age" IS NULL OR "students"."age" BETWEEN 1 AND 120)
);
--> statement-breakpoint
CREATE TABLE "teacher_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"access_code_id" uuid NOT NULL,
	"name" text NOT NULL,
	"professional_name" text DEFAULT '' NOT NULL,
	"email" text,
	"phone" text DEFAULT '' NOT NULL,
	"main_subject" text DEFAULT '' NOT NULL,
	"additional_subjects" text DEFAULT '' NOT NULL,
	"photo_url" text,
	"logo_url" text,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teacher_profiles_access_code_id_unique" UNIQUE("access_code_id")
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_access_code_id_access_codes_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."access_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_packages" ADD CONSTRAINT "lesson_packages_access_code_id_access_codes_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."access_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_packages" ADD CONSTRAINT "lesson_packages_access_code_id_student_id_students_access_code_id_id_fk" FOREIGN KEY ("access_code_id","student_id") REFERENCES "public"."students"("access_code_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_access_code_id_access_codes_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."access_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_access_code_id_student_id_students_access_code_id_id_fk" FOREIGN KEY ("access_code_id","student_id") REFERENCES "public"."students"("access_code_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_access_code_id_student_id_package_id_lesson_packages_access_code_id_student_id_id_fk" FOREIGN KEY ("access_code_id","student_id","package_id") REFERENCES "public"."lesson_packages"("access_code_id","student_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_access_code_id_access_codes_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."access_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_access_code_id_student_id_students_access_code_id_id_fk" FOREIGN KEY ("access_code_id","student_id") REFERENCES "public"."students"("access_code_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_entries" ADD CONSTRAINT "progress_entries_access_code_id_access_codes_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."access_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_entries" ADD CONSTRAINT "progress_entries_access_code_id_student_id_students_access_code_id_id_fk" FOREIGN KEY ("access_code_id","student_id") REFERENCES "public"."students"("access_code_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_access_code_id_access_codes_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."access_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_access_code_id_student_id_students_access_code_id_id_fk" FOREIGN KEY ("access_code_id","student_id") REFERENCES "public"."students"("access_code_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_access_code_id_access_codes_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."access_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_admin_id_admin_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_goals" ADD CONSTRAINT "student_goals_access_code_id_access_codes_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."access_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_goals" ADD CONSTRAINT "student_goals_access_code_id_student_id_students_access_code_id_id_fk" FOREIGN KEY ("access_code_id","student_id") REFERENCES "public"."students"("access_code_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_access_code_id_access_codes_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."access_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_access_code_id_access_codes_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."access_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_owner_date_idx" ON "activity_logs" USING btree ("access_code_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "package_one_current" ON "lesson_packages" USING btree ("student_id") WHERE "lesson_packages"."status" = 'current';--> statement-breakpoint
CREATE INDEX "lessons_owner_date_idx" ON "lessons" USING btree ("access_code_id","date");--> statement-breakpoint
CREATE INDEX "lessons_student_date_idx" ON "lessons" USING btree ("student_id","date");--> statement-breakpoint
CREATE INDEX "payments_owner_status_date_idx" ON "payments" USING btree ("access_code_id","status","due_date");--> statement-breakpoint
CREATE INDEX "progress_owner_student_date_idx" ON "progress_entries" USING btree ("access_code_id","student_id","date");--> statement-breakpoint
CREATE INDEX "reports_owner_student_period_idx" ON "reports" USING btree ("access_code_id","student_id","period_start");--> statement-breakpoint
CREATE INDEX "sessions_expiry_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "goals_owner_student_idx" ON "student_goals" USING btree ("access_code_id","student_id");--> statement-breakpoint
CREATE INDEX "students_owner_active_idx" ON "students" USING btree ("access_code_id","active");