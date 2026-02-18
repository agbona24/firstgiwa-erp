<?php

namespace Database\Seeders;

use App\Models\LandingPageContent;
use Illuminate\Database\Seeder;

class LandingPageContentSeeder extends Seeder
{
    public function run(): void
    {
        LandingPageContent::updateOrCreate(['key' => 'default'], [
            'content' => [
                'nav' => [
                    'links' => [
                        ['label' => 'Features', 'href' => '#features'],
                        ['label' => 'How It Works', 'href' => '#how-it-works'],
                        ['label' => 'Pricing', 'href' => '#pricing'],
                        ['label' => 'Testimonials', 'href' => '#testimonials'],
                    ],
                    'ctaPrimary' => ['label' => 'Start Free Trial', 'href' => '/signup'],
                    'ctaSecondary' => ['label' => 'Log In', 'href' => '/login'],
                ],
                'hero' => [
                    'badge' => 'Real-Time Manufacturing ERP',
                    'headline' => 'Control Your Factory Floor in Real Time',
                    'subtext' => 'FactoryPulse ERP gives manufacturers complete visibility into production, inventory, sales, and finances — all from one powerful dashboard. Stop guessing, start producing.',
                    'ctaPrimary' => ['label' => 'Start Free Trial', 'href' => '/signup'],
                    'ctaSecondary' => ['label' => 'Watch Demo', 'href' => '#dashboard-preview'],
                    'trustNote' => 'No credit card required · 14-day free trial · Cancel anytime',
                ],
                'trustedBy' => [
                    'eyebrow' => 'TRUSTED BY MANUFACTURERS WORLDWIDE',
                    'stats' => [
                        ['value' => 500, 'suffix' => '+', 'label' => 'Factories'],
                        ['value' => 50000, 'suffix' => '+', 'label' => 'Active Users'],
                        ['value' => 99.9, 'suffix' => '%', 'label' => 'Uptime'],
                        ['value' => 15, 'suffix' => '+', 'label' => 'Countries'],
                    ],
                ],
                'features' => [
                    ['icon' => 'inventory', 'title' => 'Inventory Management', 'description' => 'Track raw materials, finished goods, and work-in-progress across multiple warehouses in real time. Automatic reorder alerts keep you stocked.', 'color' => 'blue'],
                    ['icon' => 'production', 'title' => 'Production Planning', 'description' => 'Formula-based manufacturing with batch tracking, loss monitoring, and production scheduling. Know exactly what goes in and what comes out.', 'color' => 'green'],
                    ['icon' => 'pos', 'title' => 'POS System', 'description' => 'Multi-terminal point of sale with offline support, shift management, and instant receipts. Works even when the internet doesn\'t.', 'color' => 'purple'],
                    ['icon' => 'accounting', 'title' => 'Accounting & Finance', 'description' => 'Automated P&L statements, balance sheets, VAT reports, and transaction ledgers. Financial clarity without the spreadsheet chaos.', 'color' => 'orange'],
                    ['icon' => 'payroll', 'title' => 'Payroll & HR', 'description' => 'Manage staff profiles, process salaries, track attendance, and handle deductions. Everything your HR team needs in one place.', 'color' => 'teal'],
                    ['icon' => 'purchases', 'title' => 'Purchase Orders', 'description' => 'Streamlined procurement with supplier management, delivery tracking, and approval workflows. Never miss a critical restock.', 'color' => 'indigo'],
                    ['icon' => 'sales', 'title' => 'Sales & Credit', 'description' => 'Order management with built-in credit facility, customer ledgers, and payment tracking. Extend credit confidently with full visibility.', 'color' => 'rose'],
                    ['icon' => 'audit', 'title' => 'Audit Trail', 'description' => 'Complete compliance logging of every action, every user, every change. Role-based access control ensures accountability at every level.', 'color' => 'amber'],
                ],
                'howItWorks' => [
                    'eyebrow' => 'GET STARTED IN MINUTES',
                    'headline' => 'Three Steps to Smarter Manufacturing',
                    'steps' => [
                        ['step' => 1, 'title' => 'Sign Up & Configure', 'description' => 'Create your account, set up your company profile, branches, and invite your team. Our setup wizard guides you through every step.'],
                        ['step' => 2, 'title' => 'Import Your Data', 'description' => 'Bring in your products, customers, suppliers, and existing inventory. Bulk import tools make migration painless.'],
                        ['step' => 3, 'title' => 'Go Live', 'description' => 'Start managing production, processing sales, and tracking finances immediately. Real results from day one.'],
                    ],
                ],
                'dashboardPreview' => [
                    'eyebrow' => 'POWERFUL DASHBOARD',
                    'title' => 'See Your Entire Factory at a Glance',
                    'subtitle' => 'Revenue, production output, inventory levels, pending orders — everything you need to make informed decisions, updated in real time.',
                ],
                'pricing' => [
                    'eyebrow' => 'SIMPLE, TRANSPARENT PRICING',
                    'headline' => 'Plans That Scale With Your Factory',
                    'subtext' => 'Start small, grow big. All plans include a 14-day free trial.',
                ],
                'testimonials' => [
                    ['quote' => 'FactoryPulse transformed how we manage our paint manufacturing. We went from spreadsheets and guesswork to real-time visibility across 3 production lines. Our material waste dropped 23% in the first quarter.', 'author' => 'Adebayo Johnson', 'role' => 'Operations Director', 'company' => 'Lagos Paint Industries', 'initials' => 'AJ'],
                    ['quote' => 'The POS system works flawlessly even during network outages — critical for our factory outlet. The credit facility module alone saved us from bad debt worth millions. This is the ERP we\'ve been looking for.', 'author' => 'Fatima Al-Hassan', 'role' => 'Managing Director', 'company' => 'Northern Plastics Ltd', 'initials' => 'FA'],
                    ['quote' => 'We process 500+ production runs monthly across two factories. FactoryPulse handles it all — batch tracking, loss calculations, quality checks. Our audit compliance went from a nightmare to one-click reports.', 'author' => 'Chukwudi Okafor', 'role' => 'Factory Manager', 'company' => 'Delta Chemical Works', 'initials' => 'CO'],
                ],
                'cta' => [
                    'headline' => 'Ready to Transform Your Manufacturing?',
                    'subtext' => 'Join 500+ factories already using FactoryPulse ERP to streamline operations, reduce waste, and boost profitability.',
                    'ctaPrimary' => ['label' => 'Start Your Free Trial', 'href' => '/signup'],
                    'ctaSecondary' => ['label' => 'Schedule a Demo', 'href' => '#contact'],
                ],
                'footer' => [
                    'description' => 'Enterprise-grade manufacturing ERP built for modern factories. Real-time production tracking, inventory management, and financial reporting.',
                    'columns' => [
                        ['title' => 'Product', 'links' => [
                            ['label' => 'Features', 'href' => '#features'],
                            ['label' => 'Pricing', 'href' => '#pricing'],
                            ['label' => 'Demo', 'href' => '#dashboard-preview'],
                            ['label' => 'Changelog', 'href' => '#'],
                        ]],
                        ['title' => 'Company', 'links' => [
                            ['label' => 'About Us', 'href' => '#'],
                            ['label' => 'Contact', 'href' => '#'],
                            ['label' => 'Careers', 'href' => '#'],
                            ['label' => 'Blog', 'href' => '#'],
                        ]],
                        ['title' => 'Legal', 'links' => [
                            ['label' => 'Privacy Policy', 'href' => '#'],
                            ['label' => 'Terms of Service', 'href' => '#'],
                            ['label' => 'Security', 'href' => '#'],
                            ['label' => 'SLA', 'href' => '#'],
                        ]],
                    ],
                    'copyright' => '© 2026 FactoryPulse ERP. All rights reserved.',
                    'tagline' => 'Built with manufacturing in mind.',
                ],
            ],
            'is_active' => true,
        ]);
    }
}
