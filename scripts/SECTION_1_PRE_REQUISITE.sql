-- ==============================================================================
-- DCLM YOUTH FUND KABALA: PRODUCTION SETUP - SECTION 1
-- ==============================================================================

-- 1. EXTEND MEMBER ROLES
-- RUN THIS FILE BY ITSELF FIRST. 
-- PostgreSQL requires this to be COMMITTED before the new value can be used.
ALTER TYPE public.member_role ADD VALUE IF NOT EXISTS 'youth_coordinator';
