# GitHub Copilot Instructions for Technical Documentation

## Repository Overview
This repository serves as a comprehensive knowledge base for technical documentation. It focuses on clear, consistent writing practices for multilingual technical content (English/Indonesian).

## Writing Style and Conventions
- **Multilingual Content**: Every concept should have `_en.md` and `_id.md` pairs for English/Indonesian versions. Ensure both versions are synchronized in content and structure.
- **Detailed Documentation**: Provide comprehensive overviews with practical examples rather than short summaries. Use clear, concise language accessible to developers of varying experience levels.
- **Consistent Structure**: Organize content by categories like architecture, principles, patterns, practices, and anti-patterns. Use standard Markdown formatting with proper headings, lists, and code blocks.
- **Clear Linking**: Use relative paths for internal documentation links (e.g., `docs/best-practices/patterns/...`). Include cross-references to related concepts for better navigation.
- **Code Samples**: Use concise code snippets or partial examples rather than full implementations to keep documentation engaging and readable. Format code blocks with appropriate language syntax highlighting.
- **Tone and Audience**: Write in a professional, neutral tone. Assume readers are technical professionals; avoid overly simplistic explanations or advanced jargon without context.
- **Updates and Reviews**: Regularly review and update documentation for accuracy. Encourage contributions via pull requests with clear descriptions of changes.

## Folder Structure and Document Placement
- **Main Structure**: Documentation is organized under `docs/` with subfolders for different categories:
  - `docs/architecture/`: Architectural styles and patterns (e.g., microservices, monolithic).
  - `docs/best-practices/`: Principles, patterns, practices, and anti-patterns.
  - `docs/ecosystem/`: Cloud platforms and services (AWS, Azure, Google Cloud).
  - `docs/technologies/`: Infrastructure tools and communication protocols.
- **File Naming Convention**: Use `_en.md` for English versions and `_id.md` for Indonesian versions (e.g., `factory_en.md` and `factory_id.md`).
- **Subfolder Organization**: Within each category, use subfolders for subcategories (e.g., `docs/best-practices/patterns/design/` for design patterns).
- **Document Placement**: Place new documents in the appropriate category and subcategory based on content. For example, a new design pattern goes in `docs/best-practices/patterns/design/`.
- **Consistency**: Maintain alphabetical order and consistent naming across folders to ensure easy navigation.

## Documentation Maintenance
- **Contributing Guidelines**: Follow established writing standards; update documentation for any structural changes.
- **Hosting Compatibility**: Content is designed for GitHub Pages or GitLab Wiki platforms.
- **Documentation-Only Focus**: This repository contains documentation; avoid including buildable code or executable scripts.

## Linking Documentation
- Reference existing documentation files for related concepts (e.g., link to `docs/best-practices/principles/solid_en.md` for SOLID principles).
- Maintain consistency in file naming and path structures for easy navigation.