#!/bin/bash

echo "🔧 Assembling CreateEventPage.new.jsx..."

cd /Users/vikumar/Projects/CascadeProjects/windsurf-project/organiser-platform

# Check if all chunks exist
CHUNKS=(
    "CHUNK_1_component_state.js"
    "CHUNK_2_progress_bar.js"
    "CHUNK_3_basics_step.js"
    "CHUNK_4_location_step.js"
    "CHUNK_5_details_step_part1.js"
    "CHUNK_6_details_step_part2.js"
    "CHUNK_7_review_step_part1.js"
    "CHUNK_8_review_step_part2.js"
    "CHUNK_9_final_render.js"
)

echo "✅ Checking chunk files..."
for chunk in "${CHUNKS[@]}"; do
    if [ ! -f "$chunk" ]; then
        echo "❌ Missing: $chunk"
        exit 1
    fi
    echo "  ✓ $chunk"
done

echo ""
echo "📝 Assembling complete file..."

# Combine all chunks
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
    > frontend/src/pages/CreateEventPage.assembled.jsx

# Verify
LINES=$(wc -l < frontend/src/pages/CreateEventPage.assembled.jsx)
echo ""
echo "✅ Assembly complete!"
echo "📊 Total lines: $LINES"

if [ $LINES -lt 500 ]; then
    echo "⚠️  Warning: File seems too short (expected ~700-800 lines)"
    exit 1
fi

echo ""
echo "🎉 Success! File created: frontend/src/pages/CreateEventPage.assembled.jsx"
echo ""
echo "Next steps:"
echo "1. Review the assembled file"
echo "2. Run: mv frontend/src/pages/CreateEventPage.jsx frontend/src/pages/CreateEventPage.old.jsx"
echo "3. Run: mv frontend/src/pages/CreateEventPage.assembled.jsx frontend/src/pages/CreateEventPage.jsx"
echo "4. Test with: cd frontend && npm run dev"
