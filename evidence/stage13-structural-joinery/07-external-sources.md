# External source notes — Stage 13

## Häfele official manufacturer pages

1. Häfele, **Connector housing, Minifix 15**, official product page: https://www.hafele.com/us/en/product/connector-housing-minifix-15/P-00861332/
   - The official page identifies the Minifix 15 connector housing family and exposes CAD/technical-document availability through the product selection flow.
   - The implementation records only the verified housing facts selected from the official product data: housing diameter 15 mm, housing drilling depth 12.5 mm with +0.5 mm tolerance, Dim. A 8 mm, and wood-thickness compatibility as documented for the selected variant.

2. Häfele, **Connecting bolt, Minifix System**, official product page: https://www.hafele.com/us/en/product/connecting-bolt-turned-minifix-system/P-00861784/
   - The official page identifies the turned connecting-bolt family and exposes technical-document availability.
   - The implementation records the selected bolt drilling-distance/thread-length facts as manufacturer data, while keeping target-hole diameter, target-hole depth, countersink and tool UNKNOWN when the selected public source does not expose them.

## Open-source references reviewed

3. RajwanYair, **WoodworkingShop**, GitHub: https://github.com/RajwanYair/WoodworkingShop
   - Reviewed as an open-source parametric cabinet planner reference for dimensions, materials, cut-list/BOM boundaries, nesting and pure TypeScript engine separation. It was not copied into Dioris and does not serve as a manufacturer source.

4. FickleHobbyist, **cabinetry**, GitHub: https://github.com/FickleHobbyist/cabinetry
   - Reviewed as an open-source geometric cabinetry/BOM reference. Its README explicitly frames the project as a learning exercise rather than an authoritative manufacturing standard; therefore it was used only for architectural comparison, not for connector dimensions or drilling facts.

## Source policy

Manufacturer facts, Dioris family application rules, resolved structural joints and machining readiness are kept in separate layers. Marketplace or open-source project content is never used to fill an industrial parameter that is absent from the official manufacturer source.
