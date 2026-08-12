<script lang="ts">
  import ContentPage from '$components/ContentPage.svelte';
  import { t } from '$lib/i18n/translate';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const fallbackLead = $derived(
    data.locale === 'pt-BR'
      ? 'Identificação do operador, propriedade intelectual, aviso de risco e privacidade dos sites da RBX Systems.'
      : 'Operator identification, intellectual property, risk notice and privacy for the RBX Systems websites.'
  );
</script>

<ContentPage
  page={data.page}
  fallbackTitle={t(data.locale, 'nav.legal')}
  {fallbackLead}
  locale={data.locale}
/>
