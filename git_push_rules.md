# Hackathon Git Push Rule

## Version Control Policy

This repository uses the `main` branch as the primary development branch for the duration of the hackathon.

The AI must **never perform Git operations automatically**. Git commands should only be executed when the developer explicitly requests a commit or push.

### Before Every Commit

When asked to push, the AI must:

1. Run `git status`.
2. Show all modified, new, and deleted files.
3. Verify there are no unresolved merge conflicts.
4. Confirm the repository is in a valid state for committing.

### Commit Process

The AI must:

1. Stage only the files related to the completed task.
2. Avoid committing unrelated changes.
3. Generate a clear, descriptive commit message.

Examples:

```text
feat: add workflow execution engine

fix: resolve authentication session bug

refactor: improve runtime event dispatcher

docs: update project architecture
```

### Sync Before Push

Before pushing, the AI must always synchronize with the remote:

```bash
git fetch origin
git pull --rebase origin main
```

If conflicts occur:

* Stop immediately.
* Report the conflicting files.
* Do not attempt an automatic resolution unless explicitly instructed.

### Push Process

After a successful rebase and commit:

```bash
git push origin main
```

### Response After Push

After the push completes, the AI must report:

* Current branch
* Commit hash
* Commit message
* Push status (success or failure)

### Safety Rules

The AI must **never** execute any of the following unless explicitly instructed:

* `git push --force`
* `git push --force-with-lease`
* `git reset --hard`
* `git clean -fd`
* `git branch -D`
* `git rebase --abort`
* `git tag`

### If Push Is Rejected

If the remote contains newer commits:

1. Fetch the latest changes.
2. Rebase onto `origin/main`.
3. Resolve conflicts only if explicitly instructed.
4. Push again after the rebase succeeds.

The AI must never overwrite remote commits or use force-push to bypass conflicts.
# Hackathon Git Push Rule

## Version Control Policy

This repository uses the `main` branch as the primary development branch for the duration of the hackathon.

The AI must **never perform Git operations automatically**. Git commands should only be executed when the developer explicitly requests a commit or push.

### Before Every Commit

When asked to push, the AI must:

1. Run `git status`.
2. Show all modified, new, and deleted files.
3. Verify there are no unresolved merge conflicts.
4. Confirm the repository is in a valid state for committing.

### Commit Process

The AI must:

1. Stage only the files related to the completed task.
2. Avoid committing unrelated changes.
3. Generate a clear, descriptive commit message.

Examples:

```text
feat: add workflow execution engine

fix: resolve authentication session bug

refactor: improve runtime event dispatcher

docs: update project architecture
```

### Sync Before Push

Before pushing, the AI must always synchronize with the remote:

```bash
git fetch origin
git pull --rebase origin main
```

If conflicts occur:

* Stop immediately.
* Report the conflicting files.
* Do not attempt an automatic resolution unless explicitly instructed.

### Push Process

After a successful rebase and commit:

```bash
git push origin main
```

### Response After Push

After the push completes, the AI must report:

* Current branch
* Commit hash
* Commit message
* Push status (success or failure)

### Safety Rules

The AI must **never** execute any of the following unless explicitly instructed:

* `git push --force`
* `git push --force-with-lease`
* `git reset --hard`
* `git clean -fd`
* `git branch -D`
* `git rebase --abort`
* `git tag`

### If Push Is Rejected

If the remote contains newer commits:

1. Fetch the latest changes.
2. Rebase onto `origin/main`.
3. Resolve conflicts only if explicitly instructed.
4. Push again after the rebase succeeds.

The AI must never overwrite remote commits or use force-push to bypass conflicts.
generate ADR - when important changes are made