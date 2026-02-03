FROM php:8.3-apache

# Enable Apache rewrite module
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www

# Copy public files
COPY public/ /var/www/html/

# Create data and quotes directories
RUN mkdir -p /var/www/data /var/www/quotes \
    && chown -R www-data:www-data /var/www/data /var/www/quotes

# Apache configuration for .htaccess
RUN echo '<Directory /var/www/html>\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' > /etc/apache2/conf-available/custom.conf \
    && a2enconf custom

EXPOSE 80
