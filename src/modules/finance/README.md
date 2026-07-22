# Módulo: finance

Estrutura reservada para o módulo **finance** da Dioris Hub.

## Regras
- Consumir tudo do Core (`@/core`).
- Não duplicar stores, serviços ou tipos já existentes no Core.
- Toda rota do módulo será registrada em `src/routes/` seguindo o padrão do TanStack Router.
- Componentes específicos do módulo ficam em `modules/finance/components`.
- Hooks específicos em `modules/finance/hooks`.
- Services específicos em `modules/finance/services`.

Nesta fase (1.1) apenas a pasta e o barrel existem — sem telas nem lógica.
