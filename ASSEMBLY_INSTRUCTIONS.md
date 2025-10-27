# 📋 CreateEventPage.new.jsx Assembly Instructions

## Overview
You now have **9 code chunks** that need to be assembled in the correct order to complete the `CreateEventPage.new.jsx` file.

## Current State
- ✅ `CreateEventPage.new.jsx` exists with 43 lines (imports + constants)
- ✅ 9 chunk files created with the component code

## 🔧 Assembly Steps

### Step 1: Open the File
```bash
cd frontend/src/pages
code CreateEventPage.new.jsx  # or use your preferred editor
```

The file currently ends at line 43 with the `HIKING_REQUIREMENTS` array.

### Step 2: Copy-Paste Chunks in Order

**After line 43, add each chunk in this exact order:**

#### ✅ CHUNK 1: Component State & Logic
File: `CHUNK_1_component_state.js`
- Lines to add: ~110 lines
- Contains: Component function, state, hooks, navigation, form submission logic

#### ✅ CHUNK 2: Progress Bar
File: `CHUNK_2_progress_bar.js`
- Lines to add: ~30 lines
- Contains: Visual progress indicator with checkmarks

#### ✅ CHUNK 3: Basics Step
File: `CHUNK_3_basics_step.js`
- Lines to add: ~60 lines
- Contains: Title, date, time, description inputs

#### ✅ CHUNK 4: Location Step
File: `CHUNK_4_location_step.js`
- Lines to add: ~60 lines
- Contains: Google Maps autocomplete integration

#### ✅ CHUNK 5: Details Step Part 1
File: `CHUNK_5_details_step_part1.js`
- Lines to add: ~70 lines
- Contains: Difficulty cards, trail statistics

#### ✅ CHUNK 6: Details Step Part 2
File: `CHUNK_6_details_step_part2.js`
- Lines to add: ~100 lines
- Contains: Activity type, gear checklist, cost, image, deadline

#### ✅ CHUNK 7: Review Step Part 1
File: `CHUNK_7_review_step_part1.js`
- Lines to add: ~60 lines
- Contains: Review header, basics section, location section

#### ✅ CHUNK 8: Review Step Part 2
File: `CHUNK_8_review_step_part2.js`
- Lines to add: ~70 lines
- Contains: Hike details section, publish button

#### ✅ CHUNK 9: Final Render
File: `CHUNK_9_final_render.js`
- Lines to add: ~30 lines
- Contains: Step renderer switch, main component return

### Step 3: Verify the Structure

Your final file should look like this:

```javascript
// Lines 1-8: Imports
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
// ... other imports

// Lines 10-22: STEPS constants
const STEPS = { ... }
const STEP_TITLES = { ... }

// Lines 24-29: DIFFICULTY_OPTIONS
const DIFFICULTY_OPTIONS = [ ... ]

// Lines 31-42: HIKING_REQUIREMENTS
const HIKING_REQUIREMENTS = [ ... ]

// ⬇️ START ADDING CHUNKS HERE ⬇️

// CHUNK 1: Component function start
export default function CreateEventPage() {
  // State declarations
  // useEffect hooks
  // Helper functions (updateFormData, nextStep, prevStep, etc.)
  // onFinalSubmit function
  // goToStep function

  // CHUNK 2: renderProgressBar function
  const renderProgressBar = () => { ... }

  // CHUNK 3: renderBasicsStep function
  const renderBasicsStep = () => ( ... )

  // CHUNK 4: renderLocationStep function
  const renderLocationStep = () => ( ... )

  // CHUNK 5 + 6: renderDetailsStep function (combined)
  const renderDetailsStep = () => ( ... )

  // CHUNK 7 + 8: renderReviewStep function (combined)
  const renderReviewStep = () => { ... }

  // CHUNK 9: renderCurrentStep + main return
  const renderCurrentStep = () => { ... }
  
  return ( ... )
}
// Component ends
```

### Step 4: Quick Copy-Paste Method

**Option A - Manual Copy:**
1. Open each CHUNK file
2. Copy the content
3. Paste in order into `CreateEventPage.new.jsx`

**Option B - Command Line (macOS/Linux):**
```bash
cd /Users/vikumar/Projects/CascadeProjects/windsurf-project/organiser-platform

# Combine all chunks into the new file
cat frontend/src/pages/CreateEventPage.new.jsx \
    CHUNK_1_component_state.js \
    CHUNK_2_progress_bar.js \
    CHUNK_3_basics_step.js \
    CHUNK_4_location_step.js \
    CHUNK_5_details_step_part1.js \
    CHUNK_6_details_step_part2.js \
    CHUNK_7_review_step_part1.js \
    CHUNK_8_review_step_part2.js \
    CHUNK_9_final_render.js \
    > frontend/src/pages/CreateEventPage.complete.jsx

# Verify it looks good
wc -l frontend/src/pages/CreateEventPage.complete.jsx

# If verified, replace the .new file
mv frontend/src/pages/CreateEventPage.complete.jsx frontend/src/pages/CreateEventPage.new.jsx
```

## ✅ Verification Checklist

After assembly, verify:

- [ ] File has ~700-800 lines total
- [ ] No syntax errors (check with your IDE/linter)
- [ ] All imports are at the top
- [ ] Component starts with `export default function CreateEventPage() {`
- [ ] Component ends with closing `}`
- [ ] All render functions are present:
  - [ ] `renderProgressBar()`
  - [ ] `renderBasicsStep()`
  - [ ] `renderLocationStep()`
  - [ ] `renderDetailsStep()`
  - [ ] `renderReviewStep()`
  - [ ] `renderCurrentStep()`

## 🚀 Final Steps

### Replace the Old File:
```bash
cd frontend/src/pages
mv CreateEventPage.jsx CreateEventPage.old.jsx
mv CreateEventPage.new.jsx CreateEventPage.jsx
```

### Test the New Component:
```bash
cd frontend
npm run dev
```

Navigate to a group page and click "Create Event" to test!

## 🐛 Common Issues

**Issue: Missing closing bracket**
- Solution: Make sure you copied all chunks completely, including closing braces

**Issue: Duplicate code**
- Solution: Ensure you didn't copy a chunk twice

**Issue: Import errors**
- Solution: Verify line 8 imports GooglePlacesAutocomplete component

**Issue: Google Maps not loading**
- Solution: Check your `.env` file has `VITE_GOOGLE_MAPS_API_KEY`

## 📁 Chunk File Locations

All chunks are in: `/Users/vikumar/Projects/CascadeProjects/windsurf-project/organiser-platform/`

- `CHUNK_1_component_state.js`
- `CHUNK_2_progress_bar.js`
- `CHUNK_3_basics_step.js`
- `CHUNK_4_location_step.js`
- `CHUNK_5_details_step_part1.js`
- `CHUNK_6_details_step_part2.js`
- `CHUNK_7_review_step_part1.js`
- `CHUNK_8_review_step_part2.js`
- `CHUNK_9_final_render.js`

## 🎉 Success!

Once assembled, you'll have a beautiful Meetup-style create event flow with:
- ✨ Google Maps location autocomplete
- 🏔️ Hiking-specific difficulty levels and statistics
- ✅ Interactive gear requirements checklist
- 📊 Visual progress indicator
- 🎨 HikeHub's vibrant gradient design

Happy hiking! 🥾
