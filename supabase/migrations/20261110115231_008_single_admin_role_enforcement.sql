BEGIN;

CREATE OR REPLACE FUNCTION private.gicomm_enforce_single_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    old_is_admin boolean := false;
    new_is_admin boolean := false;
    other_admin_count bigint := 0;
BEGIN
    IF TG_OP = 'INSERT' THEN
        new_is_admin := COALESCE(NEW.raw_app_meta_data ->> 'role', '') = 'admin';

        IF new_is_admin THEN
            PERFORM pg_catalog.pg_advisory_xact_lock(80606111010::bigint);

            SELECT count(*)
            INTO other_admin_count
            FROM auth.users AS u
            WHERE COALESCE(u.raw_app_meta_data ->> 'role', '') = 'admin';

            IF other_admin_count > 0 THEN
                RAISE EXCEPTION 'Gicomm supports exactly one Admin account.'
                    USING ERRCODE = '23505';
            END IF;
        END IF;

        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN
        old_is_admin := COALESCE(OLD.raw_app_meta_data ->> 'role', '') = 'admin';

        IF old_is_admin THEN
            PERFORM pg_catalog.pg_advisory_xact_lock(80606111010::bigint);

            SELECT count(*)
            INTO other_admin_count
            FROM auth.users AS u
            WHERE u.id <> OLD.id
              AND COALESCE(u.raw_app_meta_data ->> 'role', '') = 'admin';

            IF other_admin_count = 0 THEN
                RAISE EXCEPTION 'The only Gicomm Admin account cannot be deleted.'
                    USING ERRCODE = '23514';
            END IF;
        END IF;

        RETURN OLD;
    END IF;

    old_is_admin := COALESCE(OLD.raw_app_meta_data ->> 'role', '') = 'admin';
    new_is_admin := COALESCE(NEW.raw_app_meta_data ->> 'role', '') = 'admin';

    IF old_is_admin OR new_is_admin THEN
        PERFORM pg_catalog.pg_advisory_xact_lock(80606111010::bigint);

        SELECT count(*)
        INTO other_admin_count
        FROM auth.users AS u
        WHERE u.id <> NEW.id
          AND COALESCE(u.raw_app_meta_data ->> 'role', '') = 'admin';

        IF new_is_admin AND NOT old_is_admin AND other_admin_count > 0 THEN
            RAISE EXCEPTION 'Gicomm already has its single Admin account.'
                USING ERRCODE = '23505';
        END IF;

        IF old_is_admin AND NOT new_is_admin AND other_admin_count = 0 THEN
            RAISE EXCEPTION 'The only Gicomm Admin account cannot be demoted.'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.gicomm_enforce_single_admin_role()
FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS gicomm_single_admin_role_guard ON auth.users;

CREATE TRIGGER gicomm_single_admin_role_guard
BEFORE INSERT OR UPDATE OR DELETE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION private.gicomm_enforce_single_admin_role();

COMMIT;
