<?php

namespace App\Mail;

use App\Models\PurchaseOrder;
use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;
use Barryvdh\DomPDF\Facade\Pdf;

class PurchaseOrderMail extends Mailable
{
    use Queueable, SerializesModels;

    public PurchaseOrder $purchaseOrder;
    public ?Tenant $tenant;

    /**
     * Create a new message instance.
     */
    public function __construct(PurchaseOrder $purchaseOrder, ?Tenant $tenant = null)
    {
        $this->purchaseOrder = $purchaseOrder;
        $this->tenant = $tenant;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $companyName = $this->tenant?->name ?? 'Our Company';
        
        return new Envelope(
            subject: "Purchase Order #{$this->purchaseOrder->po_number} from {$companyName}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.purchase-order',
            with: [
                'purchaseOrder' => $this->purchaseOrder,
                'tenant' => $this->tenant,
                'supplier' => $this->purchaseOrder->supplier,
                'items' => $this->purchaseOrder->items,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        // Convert logo to base64 for PDF rendering
        $logoBase64 = $this->getLogoBase64();
        
        $pdf = Pdf::loadView('pdf.purchase-order', [
            'purchaseOrder' => $this->purchaseOrder,
            'tenant' => $this->tenant,
            'supplier' => $this->purchaseOrder->supplier,
            'items' => $this->purchaseOrder->items,
            'logoBase64' => $logoBase64,
        ]);

        return [
            Attachment::fromData(fn() => $pdf->output(), "PO-{$this->purchaseOrder->po_number}.pdf")
                ->withMime('application/pdf'),
        ];
    }

    /**
     * Convert tenant logo to base64 for PDF rendering.
     */
    protected function getLogoBase64(): ?string
    {
        if (!$this->tenant || empty($this->tenant->logo_url)) {
            return null;
        }
        
        try {
            $logoPath = $this->tenant->logo_url;
            
            // If it's a relative URL (e.g., /storage/logos/logo.png)
            if (str_starts_with($logoPath, '/storage/')) {
                $logoPath = storage_path('app/public' . str_replace('/storage', '', $logoPath));
            } elseif (str_starts_with($logoPath, 'storage/')) {
                $logoPath = storage_path('app/public/' . str_replace('storage/', '', $logoPath));
            } elseif (str_starts_with($logoPath, 'http://') || str_starts_with($logoPath, 'https://')) {
                // For external URLs, try to fetch the image
                $imageContent = @file_get_contents($logoPath);
                if ($imageContent) {
                    $finfo = new \finfo(FILEINFO_MIME_TYPE);
                    $mimeType = $finfo->buffer($imageContent) ?: 'image/png';
                    return 'data:' . $mimeType . ';base64,' . base64_encode($imageContent);
                }
                return null;
            } else {
                // Assume it's a path relative to public
                $logoPath = public_path($logoPath);
            }
            
            if (file_exists($logoPath)) {
                $imageContent = file_get_contents($logoPath);
                $mimeType = mime_content_type($logoPath) ?: 'image/png';
                return 'data:' . $mimeType . ';base64,' . base64_encode($imageContent);
            }
        } catch (\Exception $e) {
            \Log::warning('Failed to load tenant logo for email: ' . $e->getMessage());
        }
        
        return null;
    }
}
