import { Component, OnInit, inject } from '@angular/core';
import { LugaresStore } from './core/lugares.store';
import { MapaComponent } from './mapa/mapa.component';
import { PanelComponent } from './panel/panel.component';

@Component({
  selector: 'app-root',
  imports: [PanelComponent, MapaComponent],
  template: `
    <app-panel />
    <main class="area-mapa"><app-mapa /></main>
  `,
  host: { class: 'app' },
})
export class App implements OnInit {
  private readonly store = inject(LugaresStore);

  ngOnInit(): void {
    this.store.cargar();
  }
}
