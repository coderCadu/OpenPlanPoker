# Agentes e Skills — OpenPlanPoker

## Sobre

OpenPlanPoker é uma plataforma de planning poker colaborativa. Este projeto utiliza skills customizadas para guiar o desenvolvimento, revisão de código e implementação de features.

## Skills Disponíveis

Todas as skills estão localizadas em [`.claude/skills/`](.claude/skills/). Cada skill possui um arquivo `SKILL.md` descrevendo seu propósito, gatilhos e modo de uso:

| Skill | Propósito |
|-------|-----------|
| [`tlc-spec-driven`](.claude/skills/tlc-spec-driven/SKILL.md) | Planejamento e implementação de features com verificação e commits atômicos |
| [`best-practices`](.claude/skills/best-practices/SKILL.md) | Aplicar boas práticas modernas de desenvolvimento web |
| [`coding-guidelines`](.claude/skills/coding-guidelines/SKILL.md) | Reduzir erros comuns em codificação |
| [`pr-review`](.claude/skills/pr-review/SKILL.md) | Revisar pull requests |
| [`docs-writer`](.claude/skills/docs-writer/SKILL.md) | Escrever e revisar documentação |
| [`security-best-practices`](.claude/skills/security-best-practices/SKILL.md) | Auditar segurança e implementar práticas seguras |
| [`web-quality-audit`](.claude/skills/web-quality-audit/SKILL.md) | Auditoria completa de qualidade web |
| [`frontend-design`](.claude/skills/frontend-design/SKILL.md) | Criar interfaces frontend de qualidade produção |

## Como Usar

Invoque skills via `/nome-da-skill` ou através do agent chamador quando o trigger se aplica. Consulte cada `SKILL.md` para triggers específicos e exemplos de uso.
