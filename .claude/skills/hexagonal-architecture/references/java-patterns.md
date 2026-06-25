# Java Code Patterns — Hexagonal Architecture

Concrete examples for each layer. All examples use the `Transaction` / `Account` domain as context.

---

## Domain Entity (`*-business/domain/`)

```java
// Pure Java — no framework imports
package de.mdk.finances.manager.domain;

public record Transaction(
    TransactionId id,
    AccountId accountId,
    Money amount,       // from finance-core — never BigDecimal
    String description,
    TransactionCategory category,
    LocalDate date
) {
    // Business rules live here
    public boolean isExpense() {
        return amount.isNegative();
    }

    public Transaction withCategory(TransactionCategory category) {
        return new Transaction(id, accountId, amount, description, category, date);
    }
}
```

**Rules:**
- `record` for immutable value-carrying objects; `class` only when mutation is needed
- `Money` (from `finance-core`) instead of `BigDecimal`
- No `@Entity`, no `@JsonProperty`, no `@Column`
- Business logic as methods on the entity — not in the use case

---

## Value Object (`*-business/domain/`)

```java
package de.mdk.finances.manager.domain;

public record TransactionId(UUID value) {
    public static TransactionId of(UUID value) { return new TransactionId(value); }
    public static TransactionId generate() { return new TransactionId(UUID.randomUUID()); }
}
```

---

## Port/In — Use-Case Interface (`*-business/ports/in/`)

```java
package de.mdk.finances.manager.ports.in;

public interface CreateTransaction {
    Transaction execute(CreateTransactionCommand command);
}

// Command object carries validated input — no raw HTTP types here
public record CreateTransactionCommand(
    AccountId accountId,
    Money amount,
    String description,
    TransactionCategory category,
    LocalDate date
) {}
```

```java
package de.mdk.finances.manager.ports.in;

public interface FindTransactionsByAccount {
    List<Transaction> execute(AccountId accountId, TransactionFilter filter);
}
```

**Rules:**
- One interface per use case (ISP — Interface Segregation)
- Method name `execute` for single-method interfaces, or descriptive names for multi-method
- Command/Query objects as parameters — never raw `String`/`Long` unless they're primitives with no semantics
- Return domain types, never JPA entities or response DTOs

---

## Port/Out — Repository Interface (`*-business/ports/out/`)

```java
package de.mdk.finances.manager.ports.out;

public interface TransactionRepository {
    Transaction save(Transaction transaction);
    Optional<Transaction> findById(TransactionId id);
    List<Transaction> findByAccountId(AccountId accountId, TransactionFilter filter);
    void deleteById(TransactionId id);
}
```

**Rules:**
- Interface lives in `*-business`, NOT `*-data`
- Method names are domain-language, not SQL/JPA language (`findByAccountId` not `selectWhereAccountIdEquals`)
- Parameters and return types are domain types only

---

## Use-Case Implementation (`*-data/use_cases/`)

```java
package de.mdk.finances.data.manager.use_cases;

@Component  // Spring annotation allowed here — this is the adapter layer
@RequiredArgsConstructor
public class CreateTransactionUseCase implements CreateTransaction {

    private final TransactionRepository transactionRepository;  // port/out — interface
    private final AccountRepository accountRepository;          // port/out — interface

    @Override
    public Transaction execute(CreateTransactionCommand command) {
        // 1. Load domain objects via out-ports
        Account account = accountRepository.findById(command.accountId())
            .orElseThrow(() -> new AccountNotFoundException(command.accountId()));

        // 2. Apply domain logic
        Transaction transaction = new Transaction(
            TransactionId.generate(),
            command.accountId(),
            command.amount(),
            command.description(),
            command.category(),
            command.date()
        );

        // 3. Persist via out-port
        return transactionRepository.save(transaction);
    }
}
```

**Rules:**
- Implements a port/in interface
- Injects port/out interfaces — never JPA repositories directly
- Business rules that span multiple entities belong here as orchestration; single-entity rules stay on the entity
- `@Transactional` is allowed here when needed (it's a Spring cross-cutting concern, not business logic)

---

## JPA Entity (`*-data/entities/`)

```java
package de.mdk.finances.data.manager.entities;

@Entity
@Table(name = "transactions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TransactionEntity {

    @Id
    private UUID id;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "amount_value", nullable = false)
    private BigDecimal amountValue;

    @Column(name = "amount_currency", nullable = false)
    private String amountCurrency;

    @Column(name = "description")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    private TransactionCategoryEntity category;

    @Column(name = "date", nullable = false)
    private LocalDate date;
}
```

**Rules:**
- Lives ONLY in `*-data`
- Never leaks out of the data module — the mapper converts it to/from a domain entity
- Separate enum for persistence if the domain enum must stay pure

---

## Mapper (`*-data/mappers/`)

```java
package de.mdk.finances.data.manager.mappers;

@Component
public class TransactionMapper {

    public Transaction toDomain(TransactionEntity entity) {
        return new Transaction(
            TransactionId.of(entity.getId()),
            AccountId.of(entity.getAccountId()),
            Money.of(entity.getAmountValue(), entity.getAmountCurrency()),
            entity.getDescription(),
            TransactionCategory.valueOf(entity.getCategory().name()),
            entity.getDate()
        );
    }

    public TransactionEntity toEntity(Transaction domain) {
        TransactionEntity entity = new TransactionEntity();
        entity.setId(domain.id().value());
        entity.setAccountId(domain.accountId().value());
        entity.setAmountValue(domain.amount().value());
        entity.setAmountCurrency(domain.amount().currency().getCurrencyCode());
        entity.setDescription(domain.description());
        entity.setCategory(TransactionCategoryEntity.valueOf(domain.category().name()));
        entity.setDate(domain.date());
        return entity;
    }
}
```

---

## Repository Adapter (`*-data/repositories/`)

```java
// Spring Data interface — infrastructure detail, hidden in *-data
interface TransactionJpaRepository extends JpaRepository<TransactionEntity, UUID> {
    List<TransactionEntity> findByAccountId(UUID accountId);
}

// Adapter implementing the port/out interface
@Component
@RequiredArgsConstructor
public class TransactionRepositoryAdapter implements TransactionRepository {

    private final TransactionJpaRepository jpaRepository;
    private final TransactionMapper mapper;

    @Override
    public Transaction save(Transaction transaction) {
        TransactionEntity entity = mapper.toEntity(transaction);
        return mapper.toDomain(jpaRepository.save(entity));
    }

    @Override
    public Optional<Transaction> findById(TransactionId id) {
        return jpaRepository.findById(id.value()).map(mapper::toDomain);
    }

    @Override
    public List<Transaction> findByAccountId(AccountId accountId, TransactionFilter filter) {
        return jpaRepository.findByAccountId(accountId.value())
            .stream()
            .map(mapper::toDomain)
            .filter(filter::matches)
            .toList();
    }

    @Override
    public void deleteById(TransactionId id) {
        jpaRepository.deleteById(id.value());
    }
}
```

---

## REST Controller (`*-rest-api/controller/`)

```java
@RestController
@RequestMapping("/api/finance/manager/accounts/{accountId}/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final CreateTransaction createTransaction;           // port/in — interface
    private final FindTransactionsByAccount findTransactions;   // port/in — interface

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionResponse create(
            @PathVariable UUID accountId,
            @RequestBody @Valid CreateTransactionRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        CreateTransactionCommand command = new CreateTransactionCommand(
            AccountId.of(accountId),
            Money.of(request.amount(), request.currency()),
            request.description(),
            request.category(),
            request.date()
        );

        Transaction transaction = createTransaction.execute(command);
        return TransactionResponse.from(transaction);
    }

    @GetMapping
    public List<TransactionResponse> findAll(
            @PathVariable UUID accountId,
            @RequestParam(required = false) TransactionCategory category) {

        TransactionFilter filter = TransactionFilter.of(category);
        return findTransactions.execute(AccountId.of(accountId), filter)
            .stream()
            .map(TransactionResponse::from)
            .toList();
    }
}
```

**Rules:**
- Injects port/in **interfaces**, never use-case implementations
- Maps HTTP types → Command/Query, then domain result → Response DTO
- No business logic in the controller
- `@AuthenticationPrincipal` for security context — extract user ID here and pass into command if needed

---

## Request/Response DTOs (`*-rest-api/dto/` or inner classes)

```java
public record CreateTransactionRequest(
    @NotNull BigDecimal amount,
    @NotBlank String currency,
    @NotBlank String description,
    @NotNull TransactionCategory category,
    @NotNull LocalDate date
) {}

public record TransactionResponse(
    UUID id,
    Money amount,   // uses MoneySerializer from finance-core
    String description,
    TransactionCategory category,
    LocalDate date
) {
    public static TransactionResponse from(Transaction t) {
        return new TransactionResponse(
            t.id().value(),
            t.amount(),
            t.description(),
            t.category(),
            t.date()
        );
    }
}
```

**Rules:**
- `Money` in responses uses the custom `MoneySerializer` registered in the REST API — do not serialize raw `BigDecimal`
- Validation annotations (`@NotNull`, `@Valid`) belong on request DTOs only, never domain types

---

## Unit test for a use case (no Spring)

```java
class CreateTransactionUseCaseTest {

    private final TransactionRepository transactionRepository = mock(TransactionRepository.class);
    private final AccountRepository accountRepository = mock(AccountRepository.class);
    private final CreateTransactionUseCase useCase =
        new CreateTransactionUseCase(transactionRepository, accountRepository);

    @Test
    void shouldCreateTransaction() {
        Account account = TestFixtures.anAccount();
        when(accountRepository.findById(account.id())).thenReturn(Optional.of(account));
        when(transactionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CreateTransactionCommand command = new CreateTransactionCommand(
            account.id(), Money.of("50.00", "EUR"), "Rewe", GROCERY, LocalDate.now()
        );

        Transaction result = useCase.execute(command);

        assertThat(result.amount()).isEqualTo(Money.of("50.00", "EUR"));
        assertThat(result.category()).isEqualTo(GROCERY);
        verify(transactionRepository).save(any(Transaction.class));
    }

    @Test
    void shouldThrowWhenAccountNotFound() {
        when(accountRepository.findById(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(anyCommand()))
            .isInstanceOf(AccountNotFoundException.class);
    }
}
```
