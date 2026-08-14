# Módulo: automation

Estrutura reservada para o módulo **automation** da Dioris Hub.

## Regras

- Consumir tudo do Core (`@/core`).
- Não duplicar stores, serviços ou tipos já existentes no Core.
- Toda rota do módulo será registrada em `src/routes/` seguindo o padrão do TanStack Router.
- Componentes específicos do módulo ficam em `modules/automation/components`.
- Hooks específicos em `modules/automation/hooks`.
- Services específicos em `modules/automation/services`.

Nesta fase (1.1) apenas a pasta e o barrel existem — sem telas nem lógica.
