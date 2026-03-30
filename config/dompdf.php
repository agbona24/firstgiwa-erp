<?php

/**
 * DomPDF Configuration
 * 
 * This configuration file sets the default paper size to A4 for all PDF generation.
 * To switch back to thermal/POS printer, change 'default_paper_size' to 'letter' or other sizes.
 */

return [

    /*
    |--------------------------------------------------------------------------
    | Settings
    |--------------------------------------------------------------------------
    |
    | Set some default values. It is possible to add all defines that can be set
    | in dompdf_config.inc.php. You can also override the entire config file.
    |
    */
    'show_warnings' => false,   // Throw an Exception on warnings from dompdf

    'public_path' => null,  // Override the public path if needed
    
    /*
     * Dompdf Options
     */
    'options' => [
        /**
         * The location of the DOMPDF font directory
         *
         * The location of the directory where DOMPDF will store fonts and font metrics
         * Note: This directory must exist and be writable by the webserver process.
         * *Please note the trailing slash.*
         *
         * Notes regarding fonts:
         * Additional .afm font metrics can be added by executing load_font.php from command line.
         *
         * Only the original "core" fonts are present out of the box.
         * To use additional fonts, you can install them using load_font.php command line.
         */
        'font_dir' => storage_path('fonts'),

        /**
         * The location of the DOMPDF font cache directory
         *
         * This directory stores the cached font metrics for the fonts used.
         * This directory must exist and be writable by the webserver process.
         */
        'font_cache' => storage_path('fonts'),

        /**
         * The location of a temporary directory.
         *
         * The directory specified must be writeable by the webserver process.
         * The temporary directory is required to download remote images and when
         * using the PFDLib back end.
         */
        'temp_dir' => sys_get_temp_dir(),

        /**
         * ==== IMPORTANT ====
         * dompdf's "chroot": Prevents dompdf from accessing system files or other
         * files on the webserver.  All local files opened by dompdf must be in a
         * subdirectory of this directory.  DO NOT set it to '/' since this could
         * allow an attacker to use dompdf to read any files on the server.  This
         * should be an absolute path.
         * This is only checked on command line call by dompdf.php, but not by
         * direct class use like:
         * $dompdf = new Dompdf();  $dompdf->load_html($htmldata); $dompdf->render(); $pdfdata = $dompdf->output();
         */
        'chroot' => realpath(base_path()),

        /**
         * Whether to enable font subsetting or not.
         */
        'enable_font_subsetting' => false,

        /**
         * The PDF rendering backend to use
         *
         * Valid settings are 'PDFLib', 'CPDF' (the bundled R&OS PDF class), 'GD' and
         * 'auto'. 'async' renders all images in a thread.
         * 'auto' will look for PDFLib and use it if found, or if not it will fall
         * back on CPDF.
         */
        'pdf_backend' => 'CPDF',

        /**
         * html target media view which should be rendered into pdf.
         * List of types and parsing rules for future extensions:
         * http://www.w3.org/TR/REC-html40/types.html
         *   screen, tty, tv, projection, handheld, print,
         *   braille, aural, all
         * Note: aural is deprecated in CSS 2.1 because it is replaced by speech in CSS 3.
         * Note: future iterations may also allow curved ('curved' or 'curved-all'),
         * embossed (primarily for Braille-compliant printers), and perhaps others.
         *
         * The default value (screen) includes screen and print media types.
         */
        'default_media_type' => 'screen',

        /**
         * The default paper size.
         *
         * A4 paper size (210mm x 297mm) is used for all documents.
         * To switch back to thermal/POS printer, change this to 'letter' or specific dimensions.
         *
         * @see Dompdf\Adapter\CPDF::PAPER_SIZES for valid sizes ('letter', 'legal', 'A4', etc.)
         */
        'default_paper_size' => 'a4',

        /**
         * The default paper orientation.
         *
         * The orientation of the page (portrait or landscape).
         */
        'default_paper_orientation' => 'portrait',

        /**
         * The default font family
         *
         * Used if no suitable fonts can be found. This must exist in the font folder.
         */
        'default_font' => 'serif',

        /**
         * Image DPI setting
         *
         * This setting determines the default DPI setting for images and fonts.  The
         * DPI may be overridden for inline images by explictly setting the
         * image's width & height style attributes (i.e. if the image's native
         * width is 600 pixels and you specify the image's width as 72 points,
         * the image will have a DPI of 600 in the rendered PDF.  The DPI of
         * background images can not be overridden and is controlled entirely
         * via this parameter.
         *
         * For the purposes of DOMPDF, pixels per inch (PPI) = dots per inch (DPI).
         * If a size in html is given as px (or without absolute size), this will
         * be the resulting dpi in the pdf.
         * This differs from what screen resolution is used for.
         * @var int
         */
        'dpi' => 96,

        /**
         * Enable embedded PHP
         *
         * If this setting is set to true then DOMPDF will automatically evaluate
         * embedded PHP contained within <script type="text/php"> ... </script> tags.
         *
         * Enabling this for documents you do not trust (e.g. arbitrary remote html
         * pages) is a security risk.  Embedded scripts are run with the same level of
         * system access available to dompdf.  Set this option to false if you wish to
         * process untrusted documents.
         *
         * @var bool
         */
        'enable_php' => false,

        /**
         * Enable inline Javascript
         *
         * If this setting is set to true then DOMPDF will automatically insert
         * JavaScript code contained within <script type="text/javascript"> ... </script> tags.
         *
         * @var bool
         */
        'enable_javascript' => true,

        /**
         * Enable remote file access
         *
         * If this setting is set to true, DOMPDF will access remote sites for
         * images and CSS files as required.
         * This is required for part of test case www/test/image_variants.html through www/examples.php
         *
         * Attention: This can be a security risk, in particular in combination with
         * isPhpEnabled and allowing remote access to dompdf.php or on allowing
         * remote html code to be passed to $dompdf = new DOMPDF(); $dompdf->load_html(...);
         * This allows anonymous users to download legally doubtful internet content which on
         * tracing back appears to originate from your server, or allows ## Exploit code hidden in remote html
         * to be executed by your server with your account privileges.
         *
         * @var bool
         */
        'enable_remote' => true,

        /**
         * A ratio applied to the fonts height to be more like browsers'�
         *
         * The default HTML font height is ~75% of the selected font size. This
         * multiplier can be used to change this behavior slightly.
         *
         * @var float
         */
        'font_height_ratio' => 1.1,

        /**
         * Use the HTML5 Lib parser
         *
         * @deprecated
         * @var bool
         */
        'enable_html5_parser' => true,
    ],

];
