-- Fix student submit flow: allow status transition in UPDATE policy
-- Previous policy used only USING(status='in_progress'), which is applied to NEW rows too
-- and blocked updates that set status='submitted'.

DROP POLICY IF EXISTS "Students can update their in-progress attempts"
ON "public"."test_attempts";

CREATE POLICY "Students can update their in-progress attempts"
    ON "public"."test_attempts"
    FOR UPDATE
    TO authenticated
    USING (
        student_id = auth.uid()
        AND status = 'in_progress'
    )
    WITH CHECK (
        student_id = auth.uid()
        AND status IN ('in_progress', 'submitted', 'timed_out')
    );
