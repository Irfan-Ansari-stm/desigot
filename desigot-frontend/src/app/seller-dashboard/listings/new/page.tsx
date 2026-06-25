"use client";
// @ts-nocheck
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import { useCreateListing, useUploadMedia, useCategories, useListingFacets } from "@/hooks/useListings";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { toast } from "@/store/ui.store";
import { getErrorMessage } from "@/lib/api";
import { Upload, X, ImageIcon, Package, ArrowLeft, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(5, "Title must be at least 5 chars").max(200),
  description: z.string().min(50, "Description must be at least 50 chars"),
  category_id: z.string().uuid("Please select a category"),
  listing_type: z.enum(["asset", "service"]),
  price_personal: z.string().optional(),
  price_commercial: z.string().optional(),
  price_extended: z.string().optional(),
  currency: z.string().optional(),
  tags_input: z.string().optional(),
  software_input: z.string().optional(),
  formats_input: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const STEPS = ["Details", "Media", "Pricing", "Review"];

export default function NewListingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [listingId, setListingId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; preview: string; type: string }[]>([]);
  const [selectedSoftware, setSelectedSoftware] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);

  const createListing = useCreateListing();
  const uploadMedia   = useUploadMedia();
  const { data: categories } = useCategories();
  const { data: facets } = useListingFacets();

  const catOptions = [
    { value: "", label: "Select a category" },
    ...((categories as { id: string; name: string }[] | undefined) || []).map((c) => ({ value: c.id, label: c.name })),
  ];
  const typeOptions = (facets?.listing_types || []).map((option) => ({
    value: option.value,
    label: option.label || option.value,
  }));
  const softwareOptions = (facets?.software || []).map((option) => option.value);
  const formatOptions = (facets?.file_formats || []).map((option) => option.value);

  const { register, handleSubmit, control, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { listing_type: "asset", currency: "USD" },
  });

  const listingType = watch("listing_type");

  const { getRootProps: getPreviewProps, getInputProps: getPreviewInput } = useDropzone({
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 20,
    onDrop: (files) => {
      const newFiles = files.map((f) => ({ file: f, preview: URL.createObjectURL(f), type: "preview_image" }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    },
  });

  const { getRootProps: getDeliveryProps, getInputProps: getDeliveryInput } = useDropzone({
    maxFiles: 1,
    onDrop: (files) => {
      const f = files[0];
      if (f) setUploadedFiles((prev) => [...prev.filter((x) => x.type !== "delivery_file"), { file: f, preview: "", type: "delivery_file" }]);
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
const onSubmitDetails = async (data: any) => {
    try {
      const softwareInput = data.software_input
        ? (data.software_input as string).split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];
      const formatsInput = data.formats_input
        ? (data.formats_input as string).split(",").map((f: string) => f.trim()).filter(Boolean)
        : [];
      const payload = {
        title: data.title,
        description: data.description,
        category_id: data.category_id,
        listing_type: data.listing_type,
        price_personal:  data.price_personal  ? parseInt(data.price_personal)  * 100 : undefined,
        price_commercial:data.price_commercial ? parseInt(data.price_commercial) * 100 : undefined,
        price_extended:  data.price_extended  ? parseInt(data.price_extended)  * 100 : undefined,
        currency: data.currency,
        tags: data.tags_input ? (data.tags_input as string).split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        software_compat: Array.from(new Set([...selectedSoftware, ...softwareInput])),
        file_formats: Array.from(new Set([...selectedFormats, ...formatsInput])),
      };
      const listing = await createListing.mutateAsync(payload as Parameters<typeof createListing.mutateAsync>[0]);
      setListingId(listing.id);
      setStep(1);
      toast.success("Listing created! Now upload your media files.");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleUploadMedia = async () => {
    if (!listingId) return;
    let uploaded = 0;
    for (const f of uploadedFiles) {
      try {
        await uploadMedia.mutateAsync({ listingId, file: f.file, mediaType: f.type, sortOrder: uploaded });
        uploaded++;
      } catch (err) { toast.error(`Failed to upload ${f.file.name}`); }
    }
    if (uploaded > 0) toast.success(`${uploaded} file(s) uploaded`);
    setStep(2);
  };

  const handleFinish = () => {
    toast.success("Listing saved as draft. Submit for review when ready!");
    router.push("/seller-dashboard/listings");
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div><h1 className="text-2xl font-bold text-ink-primary">Create New Listing</h1><p className="text-sm text-ink-secondary">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p></div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
              i < step ? "bg-success text-white" : i === step ? "bg-brand text-white" : "bg-surface-100 text-ink-secondary")}>
              {i < step ? "✓" : i + 1}
            </div>
            <span className={cn("text-xs font-medium hidden sm:block", i === step ? "text-ink-primary" : "text-ink-secondary")}>{s}</span>
            {i < STEPS.length - 1 && <div className={cn("h-px flex-1 min-w-[20px]", i < step ? "bg-success" : "bg-border")} />}
          </div>
        ))}
      </div>

      {/* Step 0: Details */}
      {step === 0 && (
        <form onSubmit={handleSubmit(onSubmitDetails)} className="space-y-5">
          <Card>
            <h2 className="text-base font-semibold text-ink-primary mb-4">Basic Information</h2>
            <div className="space-y-4">
              <Input label="Listing Title" placeholder="e.g. Premium Dashboard UI Kit — 200+ Figma Components"
                errorMessage={errors.title?.message} {...register("title")} />
              <Textarea label="Description" placeholder="Describe what's included, who it's for, and why it's valuable. Be specific about features, file formats, and use cases." rows={5}
                errorMessage={errors.description?.message} {...register("description")} />
              <div className="grid grid-cols-2 gap-4">
                <Controller name="category_id" control={control} render={({ field }) => (
                  <Select label="Category" options={catOptions} value={field.value} onChange={field.onChange} errorMessage={errors.category_id?.message} />
                )} />
                <Controller name="listing_type" control={control} render={({ field }) => (
                  <Select label="Type" options={typeOptions}
                    value={field.value} onChange={field.onChange} disabled={!typeOptions.length} />
                )} />
              </div>
              <Input label="Tags (comma-separated)" placeholder="dashboard, ui-kit, figma, dark-mode, components"
                helperText="Add relevant tags to help buyers find your listing" {...register("tags_input")} />
            </div>
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-ink-primary mb-4">Compatibility</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-primary mb-2">Compatible Software</label>
                <div className="flex flex-wrap gap-2">
                  {softwareOptions.map((s) => (
                    <button key={s} type="button" onClick={() => setSelectedSoftware((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                      className={cn("px-3 py-1.5 text-sm rounded-lg border transition-all", selectedSoftware.includes(s) ? "bg-brand text-white border-brand" : "border-border text-ink-secondary hover:border-brand/40")}>
                      {s}
                    </button>
                  ))}
                </div>
                <Input label="Add Software" placeholder="Comma-separated software names"
                  helperText="New values will be saved with this listing." {...register("software_input")} wrapperClassName="mt-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-primary mb-2">File Formats</label>
                <div className="flex flex-wrap gap-2">
                  {formatOptions.map((f) => (
                    <button key={f} type="button" onClick={() => setSelectedFormats((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f])}
                      className={cn("px-3 py-1.5 text-sm rounded-lg border transition-all", selectedFormats.includes(f) ? "bg-brand text-white border-brand" : "border-border text-ink-secondary hover:border-brand/40")}>
                      {f}
                    </button>
                  ))}
                </div>
                <Input label="Add File Formats" placeholder="Comma-separated file formats"
                  helperText="Include extensions or format names buyers can filter by." {...register("formats_input")} wrapperClassName="mt-3" />
              </div>
            </div>
          </Card>

          {listingType === "asset" && (
            <Card>
              <h2 className="text-base font-semibold text-ink-primary mb-1">Pricing</h2>
              <p className="text-xs text-ink-secondary mb-4">Set prices in USD. Leave blank to disable a license tier.</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: "price_personal" as const, label: "Personal", desc: "Non-commercial use" },
                  { name: "price_commercial" as const, label: "Commercial", desc: "Single project" },
                  { name: "price_extended" as const, label: "Extended", desc: "Unlimited use" },
                ].map((tier) => (
                  <div key={tier.name}>
                    <Input label={tier.label} type="number" min="1" placeholder="0" prefix="$"
                      helperText={tier.desc} {...register(tier.name)} />
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="flex justify-end">
            <Button type="submit" loading={isSubmitting} leftIcon={<Save className="h-4 w-4" />}>Save & Continue</Button>
          </div>
        </form>
      )}

      {/* Step 1: Media */}
      {step === 1 && (
        <div className="space-y-5">
          <Card>
            <h2 className="text-base font-semibold text-ink-primary mb-2">Preview Images</h2>
            <p className="text-xs text-ink-secondary mb-4">Upload up to 20 preview images. These are shown to buyers before purchase. First image is the thumbnail.</p>
            <div {...getPreviewProps()} className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-accent/40 hover:bg-surface-50 transition-all">
              <input {...getPreviewInput()} />
              <ImageIcon className="h-10 w-10 text-border mx-auto mb-2" />
              <p className="text-sm font-medium text-ink-primary">Drop images here or click to browse</p>
              <p className="text-xs text-ink-secondary mt-1">PNG, JPG, WebP — max 10MB each</p>
            </div>
            {uploadedFiles.filter((f) => f.type === "preview_image").length > 0 && (
              <div className="flex gap-3 mt-3 flex-wrap">
                {uploadedFiles.filter((f) => f.type === "preview_image").map((f, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                    <img src={f.preview} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setUploadedFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <X className="h-5 w-5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-ink-primary mb-2">Delivery File</h2>
            <p className="text-xs text-ink-secondary mb-4">Upload the actual file buyers will receive after purchase. Kept private until purchase.</p>
            <div {...getDeliveryProps()} className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-accent/40 hover:bg-surface-50 transition-all">
              <input {...getDeliveryInput()} />
              <Upload className="h-10 w-10 text-border mx-auto mb-2" />
              <p className="text-sm font-medium text-ink-primary">Drop your design file here</p>
              <p className="text-xs text-ink-secondary mt-1">ZIP, Figma, Sketch, PDF — up to 200MB</p>
            </div>
            {uploadedFiles.filter((f) => f.type === "delivery_file").map((f, i) => (
              <div key={i} className="flex items-center gap-3 mt-3 p-3 bg-surface-50 rounded-lg">
                <Package className="h-5 w-5 text-accent shrink-0" />
                <span className="text-sm font-medium text-ink-primary flex-1 truncate">{f.file.name}</span>
                <button onClick={() => setUploadedFiles((prev) => prev.filter((x) => x.type !== "delivery_file"))} className="text-ink-secondary hover:text-danger"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </Card>

          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(0)}>← Back</Button>
            <Button onClick={handleUploadMedia} loading={uploadMedia.isPending}>Upload & Continue →</Button>
          </div>
        </div>
      )}

      {/* Step 2: Pricing review (already set in step 0 for assets) */}
      {step === 2 && (
        <div className="space-y-5">
          <Card>
            <h2 className="text-base font-semibold text-ink-primary mb-4">Review & Publish</h2>
            <p className="text-sm text-ink-secondary mb-6">Your listing has been saved as a draft. Review the details below before submitting for moderation.</p>
            <div className="bg-surface-50 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-success font-medium">✓ Listing created</p>
              <p className="text-success font-medium">✓ Media files uploaded</p>
              <p className="text-ink-secondary">→ Submit for review when ready</p>
            </div>
          </Card>
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
            <Button variant="accent" onClick={handleFinish} leftIcon={<Save className="h-4 w-4" />}>Save as Draft</Button>
          </div>
        </div>
      )}
    </div>
  );
}
