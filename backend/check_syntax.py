#!/usr/bin/env python
"""
Syntax and import checker for Python files
"""
import py_compile
import sys
import os

files = [
    'main.py',
    'models/schemas.py',
    'routers/products.py',
    'routers/finder.py',
    'routers/designer.py',
    'services/openai_service.py',
    'services/designer_service.py',
    'services/price_service.py',
    'services/query_service.py',
    'services/review_service.py',
    'services/source_service.py',
    'services/tryon_service.py',
]

print("=" * 80)
print("PYTHON SYNTAX CHECK")
print("=" * 80)

errors = []
success_count = 0

for file_path in files:
    try:
        py_compile.compile(file_path, doraise=True)
        print(f"✓ {file_path}")
        success_count += 1
    except py_compile.PyCompileError as e:
        print(f"✗ {file_path}")
        errors.append({
            'file': file_path,
            'error': str(e)
        })
    except Exception as e:
        print(f"✗ {file_path}")
        errors.append({
            'file': file_path,
            'error': f"{type(e).__name__}: {str(e)}"
        })

print("\n" + "=" * 80)
print(f"Results: {success_count}/{len(files)} files passed")
print("=" * 80)

if errors:
    print("\nERRORS FOUND:\n")
    for err in errors:
        print(f"\n--- File: {err['file']} ---")
        print(err['error'])
    sys.exit(1)
else:
    print("\nAll files passed syntax check!")
    sys.exit(0)
