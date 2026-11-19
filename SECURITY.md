# Security Policy

## Supported versions

The latest published version receives fixes. Older versions are not maintained.

## Reporting a vulnerability

Please do not open a public issue for security problems. Use GitHub's private
[security advisory](https://github.com/not-eexto/opencode-loaded/security/advisories/new)
form instead. Include the OpenCode version, the plugin version and a minimal
reproduction.

This plugin only reads local configuration and registry files, and stores the
verified instruction paths in the plugin storage. It does not write files or
make network requests.
