<script lang="ts">
  import ContactSection from '$components/ContactSection.svelte';

  const source = 'strategos-founder-plan';
</script>

<svelte:head>
  <meta name="robots" content="noindex" />
</svelte:head>

<ContactSection
  {source}
  heading="Request Founder Plan early access"
  body="Tell us about the strategic decisions you need to work through. You choose whether we reply by email or WhatsApp."
/>
