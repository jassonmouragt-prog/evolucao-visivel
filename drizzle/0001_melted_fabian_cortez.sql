CREATE TABLE "makeup_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"access_code_id" uuid NOT NULL,
	"slot_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"responsible_access_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "makeup_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"access_code_id" uuid NOT NULL,
	"date" date NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "makeup_slot_times_valid" CHECK ("makeup_slots"."start_time" < "makeup_slots"."end_time")
);
--> statement-breakpoint
CREATE TABLE "portal_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"access_code_id" uuid NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"show_finance" boolean DEFAULT true NOT NULL,
	"show_progress" boolean DEFAULT true NOT NULL,
	"show_lesson_content" boolean DEFAULT true NOT NULL,
	"show_reports" boolean DEFAULT true NOT NULL,
	"rules_payment" text DEFAULT '' NOT NULL,
	"rules_cancellation" text DEFAULT '' NOT NULL,
	"rules_replacement" text DEFAULT '' NOT NULL,
	"schedules" text DEFAULT '' NOT NULL,
	"materials" text DEFAULT '' NOT NULL,
	"other_info" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "portal_settings_access_code_id_unique" UNIQUE("access_code_id")
);
--> statement-breakpoint
CREATE TABLE "responsible_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"access_code_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "responsible_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"responsible_access_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "responsible_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "responsible_student_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"access_code_id" uuid NOT NULL,
	"responsible_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"code" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_access_at" timestamp with time zone,
	CONSTRAINT "responsible_student_access_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "public_summary" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "makeup_requests" ADD CONSTRAINT "makeup_requests_access_code_id_access_codes_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."access_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "makeup_requests" ADD CONSTRAINT "makeup_requests_slot_id_makeup_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."makeup_slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "makeup_requests" ADD CONSTRAINT "makeup_requests_responsible_access_id_responsible_student_access_id_fk" FOREIGN KEY ("responsible_access_id") REFERENCES "public"."responsible_student_access"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "makeup_requests" ADD CONSTRAINT "makeup_requests_access_code_id_student_id_students_access_code_id_id_fk" FOREIGN KEY ("access_code_id","student_id") REFERENCES "public"."students"("access_code_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "makeup_slots" ADD CONSTRAINT "makeup_slots_access_code_id_access_codes_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."access_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_settings" ADD CONSTRAINT "portal_settings_access_code_id_access_codes_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."access_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responsible_contacts" ADD CONSTRAINT "responsible_contacts_access_code_id_access_codes_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."access_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responsible_sessions" ADD CONSTRAINT "responsible_sessions_responsible_access_id_responsible_student_access_id_fk" FOREIGN KEY ("responsible_access_id") REFERENCES "public"."responsible_student_access"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responsible_student_access" ADD CONSTRAINT "responsible_student_access_access_code_id_access_codes_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."access_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responsible_student_access" ADD CONSTRAINT "responsible_student_access_responsible_id_responsible_contacts_id_fk" FOREIGN KEY ("responsible_id") REFERENCES "public"."responsible_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responsible_student_access" ADD CONSTRAINT "responsible_student_access_access_code_id_student_id_students_access_code_id_id_fk" FOREIGN KEY ("access_code_id","student_id") REFERENCES "public"."students"("access_code_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "makeup_requests_owner_status_idx" ON "makeup_requests" USING btree ("access_code_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "makeup_slot_one_pending" ON "makeup_requests" USING btree ("slot_id") WHERE "makeup_requests"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "makeup_slots_owner_date_idx" ON "makeup_slots" USING btree ("access_code_id","date");--> statement-breakpoint
CREATE INDEX "responsible_contacts_owner_idx" ON "responsible_contacts" USING btree ("access_code_id");--> statement-breakpoint
CREATE INDEX "responsible_sessions_expiry_idx" ON "responsible_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "responsible_access_student_idx" ON "responsible_student_access" USING btree ("access_code_id","student_id");--> statement-breakpoint
CREATE INDEX "responsible_access_responsible_idx" ON "responsible_student_access" USING btree ("responsible_id");