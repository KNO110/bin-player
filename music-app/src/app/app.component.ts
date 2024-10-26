import { Component } from '@angular/core';
import { MusicPlayerComponent } from './music-player/music-player.component';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-root',
  template: `<app-music-player></app-music-player>`,
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    MusicPlayerComponent,
    MatToolbarModule
  ],
})
export class AppComponent {
  title = 'music-app';
}
