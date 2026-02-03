# Custom Quotes

Quotes are randomly displayed in shared note footers. The file is loaded dynamically, so changes take effect immediately.

If `quotes.csv` doesn't exist or is empty, no quote is displayed.

## Format

```csv
"Quote text here";"Attribution"
```

Semicolon-separated, one quote per line. Current quotes are examples only—replace with your own.

## Docker

The quotes directory is mounted as a volume. Edit `quotes.csv` on the host and refresh.
