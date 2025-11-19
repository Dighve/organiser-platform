# Documentation Structure

This directory contains organized documentation for the OutMeets platform.

## 📁 Directory Structure

### `/history/` - Historical Bug Fixes & Migrations
Archive of bug fixes and troubleshooting guides from development. Kept for reference but not actively maintained.

**Contents:**
- ACTUATOR_PATH_FIX.md
- BUGFIXES_IMAGE_UPLOAD_AND_PUBLISH.md
- EMAIL_DOMAIN_FIX.md
- INDEXES_MIGRATION_FIX.md
- MY_EVENTS_FIX.md
- RENDER_DEPLOYMENT_FIX.md
- RENDER_PORT_TROUBLESHOOTING.md
- V7_MIGRATION_BUG_FIX.md

### `/features/` - Feature Documentation
Detailed documentation for major features and implementations.

**Contents:**
- COMMENTS_FEATURE.md - Comment and reply system
- EDIT_GROUP_FUNCTIONALITY.md - Group editing capabilities
- EVENT_UI_ENHANCEMENTS.md - Event creation UI improvements
- EVENTS_TAB_PAST_EVENTS.md - Past events tab functionality
- FILE_UPLOAD_IMPLEMENTATION.md - Cloudinary file upload system
- GOOGLE_PLACES_CREATE_GROUP.md - Google Places integration
- GROUP_COVER_PHOTO_UPLOAD.md - Group banner uploads
- GROUP_DETAIL_ENHANCEMENTS.md - Group page improvements
- GROUP_MEMBERSHIP_PRIVACY.md - Member-only event access
- MEMBER_NAVIGATION_ENHANCEMENTS.md - Member profile navigation
- PARTIAL_EVENT_PREVIEW.md - Event preview for non-members
- PERFORMANCE_OPTIMIZATION.md - Performance improvements
- PLATFORM_REBRANDING.md - HikeHub → OutMeets rebrand
- PROFILE_PHOTO_IMPLEMENTATION.md - Profile photo system
- SEARCH_FUNCTIONALITY_ENHANCEMENT.md - Multi-field search

## 📚 Root Documentation

Essential docs remain in the project root:
- **README.md** - Main project overview
- **CONTRIBUTING.md** - How to contribute
- **DEPLOYMENT.md** - Production deployment guide
- **STARTUP_GUIDE.md** - Local development setup
- **TESTING_CHECKLIST.md** - QA testing checklist
- **CLOUDINARY_SETUP.md** - Image upload configuration
- **ENV_VARIABLES_REFERENCE.md** - Environment variables
- **REPOSITORY_CLEANUP.md** - Repository maintenance log

## 🎯 Documentation Philosophy

1. **Essential docs in root** - Quick access to critical information
2. **Features organized** - Detailed feature docs in `/features/`
3. **History archived** - Bug fixes preserved in `/history/`
4. **No duplication** - Single source of truth for each topic
5. **Clear naming** - Self-explanatory file names

## 🔍 Finding Documentation

- **Setting up locally?** → Start with `/STARTUP_GUIDE.md`
- **Deploying to production?** → See `/DEPLOYMENT.md`
- **Looking for a feature?** → Check `/docs/features/`
- **Investigating a bug?** → Search `/docs/history/`
- **Contributing code?** → Read `/CONTRIBUTING.md`

## 📝 Adding New Documentation

When adding new docs:
1. Keep essential setup/deployment docs in root
2. Put feature documentation in `/docs/features/`
3. Put historical bug fixes in `/docs/history/`
4. Use clear, descriptive file names
5. Update this README if adding new categories
