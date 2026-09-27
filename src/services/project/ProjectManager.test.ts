import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectRegistry } from './ProjectRegistry';
import { ProjectManager } from './ProjectManager';

describe('ProjectRegistry & ProjectManager', () => {
  let registry: ProjectRegistry;
  let manager: ProjectManager;

  beforeEach(() => {
    registry = new ProjectRegistry();
    manager = new ProjectManager(registry);
  });

  it('adds and lists projects in registry', async () => {
    await manager.addProject({
      name: 'Portfolio',
      displayName: 'Portfolio Site',
      path: 'D:/Projects/portfolio',
    });

    await manager.addProject({
      name: 'GitDrop',
      displayName: 'GitDrop Client',
      path: 'D:/Projects/GitDrop',
    });

    const list = await manager.getProjects();
    expect(list.length).toBe(2);
    expect(list.some((p) => p.name === 'Portfolio')).toBe(true);
    expect(list.some((p) => p.name === 'GitDrop')).toBe(true);
  });

  it('detects duplicate projects by name or path', async () => {
    await manager.addProject({
      name: 'Portfolio',
      path: 'D:/Projects/portfolio',
    });

    const dupName = await registry.findDuplicate('portfolio');
    expect(dupName).not.toBeNull();
    expect(dupName?.name).toBe('Portfolio');

    const dupPath = await registry.findDuplicate('other-name', 'D:/Projects/portfolio');
    expect(dupPath).not.toBeNull();

    const notDup = await registry.findDuplicate('completely-new', 'D:/Projects/new');
    expect(notDup).toBeNull();
  });

  it('opens and switches between projects cleanly', async () => {
    const p1 = await manager.addProject({
      name: 'VirtualProjectA',
      isVirtual: true,
    });

    const p2 = await manager.addProject({
      name: 'VirtualProjectB',
      isVirtual: true,
    });

    await manager.openProject(p1.id);
    expect(manager.getActiveProject()?.id).toBe(p1.id);
    expect(manager.getActiveState().fileSystem).not.toBeNull();

    await manager.switchProject(p2.id);
    expect(manager.getActiveProject()?.id).toBe(p2.id);
    expect(manager.getActiveState().fileSystem).not.toBeNull();
  });

  it('removes project from registry without removing physical files', async () => {
    const p1 = await manager.addProject({
      name: 'TempProject',
      isVirtual: true,
    });

    await manager.openProject(p1.id);
    expect(manager.getActiveProject()?.id).toBe(p1.id);

    await manager.removeProject(p1.id);
    const list = await manager.getProjects();
    expect(list.find((p) => p.id === p1.id)).toBeUndefined();
    expect(manager.getActiveProject()).toBeNull();
  });

  it('sets default project and sorts it first', async () => {
    await manager.addProject({ name: 'ProjectA', isVirtual: true });
    const p2 = await manager.addProject({ name: 'ProjectB', isVirtual: true });

    await manager.setDefaultProject(p2.id);
    const list = await manager.getProjects();
    expect(list[0].id).toBe(p2.id);
    expect(list[0].isDefault).toBe(true);
  });
});
